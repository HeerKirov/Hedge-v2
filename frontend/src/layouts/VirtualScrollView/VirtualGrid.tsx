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

interface ScrollStateView {
    state: ScrollState
}

interface ScrollView extends ScrollStateView{
    scrollTo(scrollTop: number)
    navigateTo(itemOffset: number)
}

export function useScrollView(): Readonly<ScrollView> {
    const controller: ScrollView = reactive({
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
        const view = inject(scrollControllerInjection, () => reactive({state: {scrollTop: 0, scrollHeight: 0, itemOffset: 0, itemLimit: 0}}), true)
        const { paddingValue, bufferValue, paddingStyle } = usePaddingProperties(props)

        //由底层向上提出的需求和参考值，包括内容滚动偏移量、包含缓冲区的实际高度、内容区域宽度和高度(不包括padding和buffer的内容实际大小)
        const propose = ref<ProposeData>({
            offsetTop: 0,
            offsetHeight: 0,
            scrollTop: 0,
            scrollHeight: 0,
            contentWidth: undefined,
            contentHeight: undefined
        })
        //由顶层向下计算的实际值，包括内容总高度、内容的偏移量和内容的实际高度。
        const actual = ref<ActualData>({
            totalHeight: undefined, top: 0, height: 0
        })

        const actualOffsetStyle = computed(() => ({
            height: `${actual.value.height}px`,
            paddingTop: `${actual.value.top}px`,
            paddingBottom: `${(actual.value.totalHeight ?? 0) - actual.value.top - actual.value.height}px`
        }))

        //底层事件: 发生滚动事件时重新计算propose offset
        const onScroll = (e: Event) => {
            //发生滚动时，触发offset重算
            if(actual.value.totalHeight != undefined) {
                const c = computeOffset(e.target as HTMLDivElement, actual.value, bufferValue.value, paddingValue.value)
                propose.value = {...propose.value, ...c}
            }
        }

        //底层事件: 区域大小改变时重新计算propose
        //机制: 挂载时也会触发一次，作为初始化
        watchElementResize(scrollDivRef, ({ width, height }) => {
            //显示区域大小发生变化时，修改contentHeight，并有可能触发offset重算
            //此外，挂载时，也会触发一次，相当于初始化
            console.log("watch element resize")
            if(height !== propose.value.contentHeight && scrollDivRef.value) {
                const c = computeOffset(scrollDivRef.value, actual.value, bufferValue.value, paddingValue.value)
                propose.value = {contentWidth: width, contentHeight: height, ...c}
            }else{
                propose.value = {...propose.value, contentWidth: width, contentHeight: height}
            }
        })

        //机制: 将totalHeight设为undefined触发重刷
        watch(() => actual.value.totalHeight, totalHeight => {
            //把totalHeight设置为undefined，会被认为是重设了内容，因此会把卷轴滚动回顶端，同时触发数据重刷
            if(totalHeight == undefined && scrollDivRef.value) {
                const c = computeOffset(scrollDivRef.value, actual.value, bufferValue.value, paddingValue.value)
                scrollDivRef.value.scrollTo({top: 0, behavior: "auto"})
                propose.value = {...propose.value, ...c}
            }
        })

        const lastPropose: {offsetTop?: number, offsetHeight?: number, contentWidth?: number} = {}
        const lastDataRequired: {offset?: number, limit?: number} = {}
        //上层事件: propose发生变化时重新计算data required event
        //TODO 事件节流: data required event需要节流参数
        watch(propose, ({ offsetTop, offsetHeight, contentWidth }) => {
            // console.log(`watch propose for data required (${offsetTop}, ${offsetHeight}, ${contentWidth})`)
            if(contentWidth != undefined) {
                if(offsetTop !== lastPropose.offsetTop || offsetHeight !== lastPropose.offsetHeight || contentWidth !== lastPropose.contentWidth) {
                    lastPropose.offsetTop = offsetTop
                    lastPropose.offsetHeight = offsetHeight
                    lastPropose.contentWidth = contentWidth

                    const unitWidth = contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio

                    const offset = Math.floor(offsetTop / unitHeight) * props.columnCount
                    const limit = Math.ceil((offsetTop + offsetHeight) / unitHeight) * props.columnCount - offset
                    if(lastDataRequired.offset !== offset || lastDataRequired.limit !== limit) {
                        lastDataRequired.offset = offset
                        lastDataRequired.limit = limit
                        emit("update", offset, limit)
                    }
                }
            }
        })

        const lastScroll: {scrollTop?: number, scrollHeight?: number, contentWidth?: number} = {}
        //上层事件: propose变化，或者item total数量有变时，重新计算scroll view的内容
        //TODO 上层事件: 宽度发生变化时，可能需要重新计算scroll以确保unit位置不变 (如果scroll发生变化，可以拦截本次事件emit，使scroll的变化触发下一次事件。这个方案要考虑是否会引起大量重复事件和响应)
        //TODO total变化引起重刷的机制可以挪到这里
        watch(() => [propose.value, props.total] as [ProposeData, number], ([{ scrollTop, scrollHeight, contentWidth, contentHeight }, total], [, oldTotal]) => {
            console.log(`watch propose for scroll view (${scrollTop}, ${scrollHeight}, ${contentWidth}, ${total}/${oldTotal})`)
            if(contentWidth != undefined && contentHeight != undefined && total != undefined) {
                if(lastScroll.contentWidth != undefined && lastScroll.contentWidth !== contentWidth) {
                    //width变化意味着窗口宽度拉伸，可能需要校准scroll的位置
                    lastScroll.contentWidth = contentWidth
                    lastScroll.scrollTop = scrollTop
                    lastScroll.scrollHeight = scrollHeight

                    const unitWidth = contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio

                    //根据上一次响应时

                }
                if(oldTotal !== total || scrollTop !== lastScroll.scrollTop || scrollHeight !== lastScroll.scrollHeight) {
                    if(lastScroll.contentWidth == undefined) lastScroll.contentWidth = contentWidth
                    lastScroll.scrollTop = scrollTop
                    lastScroll.scrollHeight = scrollHeight

                    const unitWidth = contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio

                    //根据可视区域的顶端计算当前首行的行数。四舍五入使首行被计算为"超过一半在可视区域内的行"
                    const firstItemRow = Math.round((scrollTop - paddingValue.value.top) / unitHeight)
                    const itemOffset = firstItemRow * props.columnCount
                    //同样的方法计算当前尾行的行数
                    const lastItemRow = Math.round((scrollTop + contentHeight + paddingValue.value.bottom) / unitHeight)
                    const lastItemOffset = Math.min(total, lastItemRow * props.columnCount)
                    //最后计算出item limit
                    const itemLimit = lastItemOffset - itemOffset

                    if(scrollTop !== view.state.scrollTop || scrollHeight !== view.state.scrollHeight || itemOffset !== view.state.itemOffset || itemLimit !== view.state.itemLimit) {
                        view.state = {scrollTop, scrollHeight, itemOffset, itemLimit}
                        console.log(`${itemOffset}-${lastItemOffset}/${props.total} (${Math.floor(100 * scrollTop / scrollHeight)}%)`)
                    }
                }
            }
        })

        const firstColumnOffset = ref(0)
        //外部事件: 属性重设时，根据data actual重新计算actual
        watch(() => props, props => {
            console.log("watch props changed")
            if(lastPropose.contentWidth && props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const unitWidth = lastPropose.contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio
                //首行前要空出的unit的数量
                const beginOffsetUnit = props.offset % props.columnCount
                firstColumnOffset.value = beginOffsetUnit * unitWidth

                const totalHeight = Math.ceil(props.total / props.columnCount) * unitHeight
                const actualOffsetTop = Math.floor((props.offset - beginOffsetUnit) / props.columnCount) * unitHeight
                const actualOffsetHeight = Math.ceil((props.limit + beginOffsetUnit) / props.columnCount) * unitHeight

                actual.value = {
                    totalHeight,
                    top: actualOffsetTop,
                    height: actualOffsetHeight
                }
            }else{
                firstColumnOffset.value = 0
                actual.value = {totalHeight: undefined, top: 0, height: 0}
            }
        }, {deep: true})

        //TODO 外部事件: 外部指定了滚动位置，指定方式是指定item offset
        watch(() => view.state.itemOffset, itemOffset => {

        })
        //TODO 外部事件: 外部指定了滚动位置，指定方式是指定scroll top
        watch(() => view.state.scrollTop,scrollTop => {

        })

        return () => <div ref={scrollDivRef} class={style.scrollList} style={paddingStyle.value} onScroll={onScroll}>
            <div ref={contentDivRef} class={style.scrollContent} style={actualOffsetStyle.value}>
                {firstColumnOffset.value > 0 ? <div style={{width: `${firstColumnOffset.value}px`, height: `1px`}}/> : undefined}
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
    //有效内容区域高度。指window的视口高度加上buffer的高度。padding的高度已经包括在window高度内了
    const usableHeight = div.clientHeight + buffer * 2
    //设定的内容卷轴高度。如果没有设定，就假设为预定的显示高度
    const totalHeight = actual.totalHeight ?? usableHeight
    //总的buffer区域高度，指buffer+padding部分的高度
    const sumBufferTop = padding.top + buffer, sumBufferBottom = padding.bottom + buffer

    //结果: 滚动条的偏移量
    const scrollTop = div.scrollTop
    //结果: offsetTop。直接由scrollTop-总buffer高度获得。如果scrollTop<=buffer，表示端点还没有移出缓冲区，因此为0
    const offsetTop = scrollTop <= sumBufferTop ? 0 : scrollTop - sumBufferTop
    //根据scroll的定义，计算scrollBottom的值。它相当于从预定的内容区域bottom到内容卷轴区域bottom的距离
    const scrollBottom = totalHeight - scrollTop - usableHeight + sumBufferTop + sumBufferBottom
    //根据同样的方法计算从下往上的偏移量高度
    const offsetBottom = scrollBottom <= sumBufferBottom ? 0 : scrollBottom - sumBufferBottom
    //结果：offsetHeight。根据totalHeight减去offset可获得
    const offsetHeight = totalHeight - offsetTop - offsetBottom
    //结果: 滚动条的高度。相当于总内容高度减去可视区域中滚动过的部分(clientHeight-paddingTop)
    const scrollHeight = totalHeight - div.clientHeight + padding.top

    return {offsetTop, offsetHeight, scrollHeight, scrollTop}
}

const scrollControllerInjection: InjectionKey<ScrollStateView> = Symbol()

interface Padding {
    top?: number
    bottom?: number
    left?: number
    right?: number
}

interface ProposeData { offsetTop: number, offsetHeight: number, scrollTop: number, scrollHeight: number, contentWidth?: number, contentHeight?: number }
interface ActualData { totalHeight?: number, top: number, height: number }