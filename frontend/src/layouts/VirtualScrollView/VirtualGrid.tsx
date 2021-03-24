import { computed, defineComponent, inject, InjectionKey, PropType, provide, reactive, readonly, ref, watch } from "vue"
import { watchElementResize } from "@/functions/document/observer"
import style from "./style.module.scss"

interface ScrollState {
    /**
     * 滚动条的当前偏移位置。
     */
    scrollTop: number
    /**
     * 滚动条的高度。它相当于content区域的高度-屏幕高度。滚动位置和高度可以计算出滚动条的滚动百分比。
     */
    scrollHeight: number
    /**
     * 当前显示区域中的第一个数据项的offset。可以用作数值导航。以第一个中轴线位于显示区域内的项为准。
     */
    itemOffset: number
    /**
     * 当前显示区域一共显示了多少个数据项。从offset的项开始，到最后一个中轴线位于显示区域内的项结束。
     */
    itemLimit: number
}

interface ScrollStateController {
    state: ScrollState
}

interface ScrollController extends ScrollStateController{
    scrollTo(scrollTop: number)
    navigateTo(itemOffset: number)
}

export function useScrollController(): Readonly<ScrollController> {
    const controller: ScrollController = reactive({
        state: {
            scrollTop: 0,
            scrollHeight: 0,
            itemOffset: 0,
            itemLimit: 0,
            itemTotal: 0
        },
        scrollTo(scrollTop) {
            controller.state.scrollTop = scrollTop > controller.state.scrollHeight ? controller.state.scrollHeight : scrollTop >= 0 ? scrollTop : 0
        },
        navigateTo(itemOffset) {
            controller.state.itemOffset = itemOffset
        }
    })
    provide(scrollControllerInjection, controller)
    return readonly(controller)
}

export default defineComponent({
    props:{
        /**
         * 位于滚动区域和内容中夹着的padding。这部分padding会被自动算入容器高度。
         */
        padding: {type: null as any as PropType<Padding | number>, default: 0},
        /**
         * 位于可视范围外的缓冲区大小。
         */
        buffer: {type: Number, default: 0},
        /**
         * Grid的列数。
         */
        columnCount: {type: Number, default: 3},
        /**
         * 每个Grid Unit的宽高比。
         */
        aspectRatio: {type: Number, default: 1},
        /**
         * 数据项的总项数。设置为undefined会被认为是需要加载数据。
         */
        total: Number,
        /**
         * 当前提供的数据项的limit。
         */
        limit: Number,
        /**
         * 当前提供的数据项的offset。
         */
        offset: Number
    },
    emits: {
        update: (_offset: number, _limit: number) => true
    },
    setup(props, { emit, slots }) {
        const scrollDivRef = ref<HTMLElement>()
        const contentDivRef = ref<HTMLElement>()
        const controller = inject(scrollControllerInjection, () => ({state: {scrollTop: 0, scrollHeight: 0, itemOffset: 0, itemLimit: 0}}), true)
        const { paddingValue, bufferValue, paddingStyle } = usePaddingProperties(props)

        //由底层向上提出的需求和参考值，包括内容总高度、内容滚动偏移量、包含缓冲区的实际高度、内容区域宽度和高度(不包括padding和buffer的内容实际大小)
        const propose = ref<ProposeData>({
            offsetTop: 0,
            offsetHeight: 0,
            contentWidth: undefined,
            contentHeight: undefined
        })
        //由顶层向下计算的实际值，包括内容的偏移量和内容的实际高度。
        const actual = ref<ActualData>({
            totalHeight: undefined, top: 0, height: 0
        })

        const onScroll = (e: Event) => {
            //发生滚动时，触发offset重算
            if(actual.value.totalHeight != undefined) {
                const { offsetTop, offsetHeight } = computeOffset(e.target as HTMLDivElement, actual.value, bufferValue.value, paddingValue.value)
                propose.value = {...propose.value, offsetTop, offsetHeight}
            }
        }

        watchElementResize(scrollDivRef, ({ width, height }) => {
            //显示区域大小发生变化时，修改contentHeight，并有可能触发offset重算
            //此外，挂载时，也会触发一次，相当于初始化
            console.log("watch element resize")
            if(height !== propose.value.contentHeight && scrollDivRef.value) {
                const { offsetTop, offsetHeight } = computeOffset(scrollDivRef.value, actual.value, bufferValue.value, paddingValue.value)
                propose.value = {
                    offsetTop,
                    offsetHeight,
                    contentWidth: width,
                    contentHeight: height
                }
            }else{
                propose.value = {...propose.value, contentWidth: width, contentHeight: height}
            }
        })

        watch(() => actual.value.totalHeight, totalHeight => {
            //把totalHeight设置为undefined，会被认为是重设了内容，因此会把卷轴滚动回顶端，同时触发数据重刷
            console.log(`watch totalHeight changed to ${totalHeight}`)
            if(totalHeight == undefined && scrollDivRef.value) {
                const { offsetTop, offsetHeight } = computeOffset(scrollDivRef.value, actual.value, bufferValue.value, paddingValue.value)
                scrollDivRef.value.scrollTo({top: 0, behavior: "auto"})
                propose.value = {...propose.value, offsetTop, offsetHeight}
            }
        })

        const actualOffsetStyle = computed(() => {
            const v = {
                height: `${actual.value.height}px`,
                paddingTop: `${actual.value.top}px`,
                paddingBottom: `${(actual.value.totalHeight ?? 0) - actual.value.top - actual.value.height}px`
            }
            console.log(`watch actualOffset changed (${v.height}, ${v.paddingTop}, ${v.paddingBottom})`)
            return v
        })

        const lastUpdateData: {offsetTop?: number, offsetHeight?: number, contentWidth?: number} = {}
        watch(propose, ({ offsetTop, offsetHeight, contentWidth }) => {
            console.log(`watch propose changed (${offsetTop}, ${offsetHeight}, ${contentWidth})`)
            if(contentWidth != undefined && (offsetTop !== lastUpdateData.offsetTop || offsetHeight !== lastUpdateData.offsetHeight || contentWidth !== lastUpdateData.contentWidth)) {
                lastUpdateData.offsetTop = offsetTop
                lastUpdateData.offsetHeight = offsetHeight
                lastUpdateData.contentWidth = contentWidth

                const unitWidth = contentWidth / props.columnCount
                const unitHeight = unitWidth / props.aspectRatio

                const offset = Math.floor(offsetTop / unitHeight) * props.columnCount
                const limit = Math.ceil((offsetTop + offsetHeight) / unitHeight) * props.columnCount - offset
                emit("update", offset, limit)
            }
        })
        watch(() => props, props => {
            console.log("watch props changed")
            if(lastUpdateData.contentWidth && props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const unitWidth = lastUpdateData.contentWidth / props.columnCount
                const unitHeight = lastUpdateData.contentWidth / props.columnCount / props.aspectRatio
                //首行前要空出的unit的数量
                const beginOffsetUnit = props.offset % props.columnCount
                const beginOffset = beginOffsetUnit * unitWidth
                const totalHeight = Math.ceil(props.total / props.columnCount) * unitHeight
                const actualOffsetTop = Math.floor((props.offset - beginOffsetUnit) / props.columnCount) * unitHeight
                const actualOffsetHeight = Math.ceil((props.limit + beginOffsetUnit) / props.columnCount) * unitHeight

                actual.value = {
                    totalHeight,
                    top: actualOffsetTop,
                    height: actualOffsetHeight
                }
            }else{
                actual.value = {totalHeight: undefined, top: 0, height: 0}
            }
        }, {deep: true})

        return () => <div ref={scrollDivRef} class={style.scrollList} style={paddingStyle.value} onScroll={onScroll}>
            <div ref={contentDivRef} class={style.scrollContent} style={actualOffsetStyle.value}>
                {slots.default?.()}
            </div>
        </div>
    }
})


function usePaddingProperties(props: { padding: Padding | number, buffer: number }) {
    const paddingValue = computed(() => ({
        top: typeof props.padding === "number" ? props.padding : props.padding?.top ?? 0,
        bottom: typeof props.padding === "number" ? props.padding : props.padding?.bottom ?? 0,
        left: typeof props.padding === "number" ? props.padding : props.padding?.left ?? 0,
        right: typeof props.padding === "number" ? props.padding : props.padding?.right ?? 0
    }))
    const bufferValue = computed(() => props.buffer)
    const paddingStyle = computed(() => ({
        paddingTop: `${paddingValue.value.top ?? 0}px`,
        paddingBottom: `${paddingValue.value.bottom ?? 0}px`,
        paddingLeft: `${paddingValue.value.left ?? 0}px`,
        paddingRight: `${paddingValue.value.right ?? 0}px`,
    }))

    return {paddingValue, bufferValue, paddingStyle}
}

function computeOffset(div: HTMLElement, actual: ActualData, buffer: number, padding: Required<Padding>) {
    //可见的显示高度。指window的视口高度加上buffer的高度。padding的高度已经包括在window高度内了
    const clientHeight = div.clientHeight + buffer * 2
    //设定的内容卷轴高度。如果没有设定，就假设为预定的显示高度
    const totalHeight = actual.totalHeight ?? clientHeight
    //总的buffer区域高度，指buffer+padding部分的高度
    const sumBufferTop = padding.top + buffer, sumBufferBottom = padding.bottom + buffer

    //结果: offsetTop。直接由scrollTop-总buffer高度获得。如果scrollTop<=buffer，表示端点还没有移出缓冲区，因此为0
    const offsetTop = div.scrollTop <= sumBufferTop ? 0 : div.scrollTop - sumBufferTop
    //根据scroll的定义，计算scrollBottom的值。它相当于从预定的内容区域bottom到内容卷轴区域bottom的距离
    const scrollBottom = totalHeight - div.scrollTop - clientHeight + sumBufferTop + sumBufferBottom
    //根据同样的方法计算从下往上的偏移量高度
    const offsetBottom = scrollBottom <= sumBufferBottom ? 0 : scrollBottom - sumBufferBottom
    //结果：offsetHeight。根据totalHeight减去offset可获得
    const offsetHeight = totalHeight - offsetTop - offsetBottom

    return {offsetTop, offsetHeight}
}

const scrollControllerInjection: InjectionKey<ScrollStateController> = Symbol()

interface Padding {
    top?: number
    bottom?: number
    left?: number
    right?: number
}

interface ProposeData { offsetTop: number, offsetHeight: number, contentWidth?: number, contentHeight?: number }
interface ActualData { totalHeight?: number, top: number, height: number }