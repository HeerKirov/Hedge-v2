import {
    computed,
    defineComponent,
    inject,
    InjectionKey,
    PropType,
    provide,
    reactive,
    readonly,
    Ref,
    ref,
    watch
} from "vue"
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

interface ScrollStateView { state: ScrollState }
interface ScrollView extends ScrollStateView { navigateTo(itemOffset: number) }
interface ScrollStateViewConsumer {
    view: ScrollStateView
    navigateRef: Ref<number | undefined>
}

const scrollControllerInjection: InjectionKey<ScrollStateViewConsumer> = Symbol()

export function useScrollView(): Readonly<ScrollView> {
    const navigateRef = ref<number | undefined>(undefined)
    const view = reactive({
        state: {
            scrollTop: 0,
            scrollHeight: 0,
            itemOffset: 0,
            itemLimit: 0,
            itemTotal: 0
        },
        navigateTo(itemOffset) {
            navigateRef.value = itemOffset
        }
    })
    provide(scrollControllerInjection, { view, navigateRef })
    return readonly(view)
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
        offset: Number,
        /**
         * 最小更新变化阈值，单位是行。当limit和offset的变化值小于此阈值*columnCount时，将不会发出事件。
         */
        minUpdateDelta: {type: Number, default: 0}
    },
    emits: {
        update: (_offset: number, _limit: number) => true
    },
    setup(props, { emit, slots }) {
        const scrollDivRef = ref<HTMLElement>()
        const contentDivRef = ref<HTMLElement>()
        const { view, navigateRef } = inject(scrollControllerInjection, () => ({view: reactive({state: {scrollTop: 0, scrollHeight: 0, itemOffset: 0, itemLimit: 0}}), navigateRef: ref<number>()}), true)
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
                const c = computeOffset(e.target as HTMLDivElement, actual.value.totalHeight, bufferValue.value, paddingValue.value)
                propose.value = {...propose.value, ...c}
            }
        }
        //功能: 滚动到目标位置
        function scrollTo(scrollTop: number) {
            if(scrollDivRef.value) {
                scrollDivRef.value.scrollTo({top: scrollTop, behavior: "auto"})
            }
        }

        //底层事件: 区域大小改变时重新计算propose
        //机制: 挂载时也会触发一次，作为初始化
        watchElementResize(scrollDivRef, ({ width, height }) => {
            //显示区域大小发生变化时，修改contentHeight，并有可能触发offset重算
            //此外，挂载时，也会触发一次，相当于初始化
            if(height !== propose.value.contentHeight && scrollDivRef.value) {
                const c = computeOffset(scrollDivRef.value, actual.value.totalHeight, bufferValue.value, paddingValue.value)
                propose.value = {contentWidth: width, contentHeight: height, ...c}
            }else{
                propose.value = {...propose.value, contentWidth: width, contentHeight: height}
            }
        })

        //机制: 将totalHeight设为undefined触发重刷
        watch(() => actual.value.totalHeight, totalHeight => {
            //把totalHeight设置为undefined，会被认为是重设了内容，因此会把卷轴滚动回顶端，同时触发数据重刷
            if(totalHeight == undefined && scrollDivRef.value) {
                const c = computeOffset(scrollDivRef.value, totalHeight, bufferValue.value, paddingValue.value)
                scrollDivRef.value.scrollTo({top: 0, behavior: "auto"})
                lastDataRequired.offset = undefined
                lastDataRequired.limit = undefined
                propose.value = {...propose.value, ...c}
            }
        })

        //上层事件: 将total设置有效值会刷新view state的值
        watch(() => props.total, (total, oldTotal) => {
            if(total != undefined && oldTotal !== total) {
                refreshViewState(propose.value, total, props.columnCount)
            }
        })

        //上层事件: propose发生变化时，有一系列复杂的预期行为。如果宽度变化/列数变化，将重新计算滚动位置；其他变化会重新计算view，以及发送update事件
        const lastDataRequired: {offset?: number, limit?: number} = {}
        watch(() => [propose.value, props.columnCount] as [ProposeData, number], ([propose, columnCount], [oldPropose, oldColumnCount]) => {
            if(propose.contentWidth != undefined) {
                //如果contentWidth或columnCount发生变化，意味着scroll可能发生偏移。因此需要计算scrollTop的预期值，并判断偏移是否发生
                if(oldPropose.contentWidth != undefined && (propose.contentWidth !== oldPropose.contentWidth || columnCount !== oldColumnCount)) {
                    const oldUnitWidth = oldPropose.contentWidth / oldColumnCount, oldUnitHeight = oldUnitWidth / props.aspectRatio
                    //根据可视区域的顶端计算上次首行的行数。四舍五入使首行被计算为"超过一半在可视区域内的行"
                    const oldFirstItemRow = Math.round((oldPropose.scrollTop - paddingValue.value.top) / oldUnitHeight)
                    const oldItemOffset = oldFirstItemRow * oldColumnCount
                    //计算上次首行相对于可视区域上界的偏移量
                    const oldFirstItemRowOffset = oldFirstItemRow * oldUnitHeight - (oldPropose.scrollTop - paddingValue.value.top)
                    //接下来依据偏移量反推新的scrollTop预期值
                    const unitWidth = propose.contentWidth / columnCount, unitHeight = unitWidth / props.aspectRatio
                    const expectedFirstItemRow = Math.floor(oldItemOffset / columnCount)
                    const expectedScrollTop = between(0, unitHeight * expectedFirstItemRow - oldFirstItemRowOffset + paddingValue.value.top, propose.scrollHeight)
                    if(expectedScrollTop !== propose.scrollTop) {
                        //预期偏移与实际偏移不一致，因此需要调整scroll并拦截后续事件
                        scrollTo(expectedScrollTop)
                        return
                    }
                }

                //计算请求数据的limit和offset是否有变，并发出事件
                if(lastDataRequired.offset == undefined || lastDataRequired.limit == undefined
                    || propose.offsetTop !== oldPropose.offsetTop
                    || propose.offsetHeight !== oldPropose.offsetHeight
                    || propose.contentWidth !== oldPropose.contentWidth) {
                    const unitWidth = propose.contentWidth / columnCount, unitHeight = unitWidth / props.aspectRatio

                    const offset = Math.floor(propose.offsetTop / unitHeight) * columnCount
                    const limit = Math.ceil((propose.offsetTop + propose.offsetHeight) / unitHeight) * columnCount - offset

                    const minUpdateDelta = props.minUpdateDelta * columnCount
                    if(lastDataRequired.offset == undefined || lastDataRequired.limit == undefined
                        || Math.abs(lastDataRequired.offset - offset) > minUpdateDelta
                        || Math.abs(lastDataRequired.limit - limit) > minUpdateDelta) {
                        lastDataRequired.offset = offset
                        lastDataRequired.limit = limit
                        console.log(`update ${offset}, ${limit}`)
                        emit("update", offset, limit)
                    }
                }

                //计算作为导航的view的值
                if(propose.scrollTop !== oldPropose.scrollTop || propose.scrollHeight !== oldPropose.scrollHeight) {
                    refreshViewState(propose, props.total, columnCount)
                }
            }
        })

        const firstColumnOffset = ref(0)
        //外部事件: 属性重设时，根据data actual重新计算actual
        watch(() => [props, propose.value.contentWidth] as [typeof props, number | undefined], ([props, contentWidth]) => {
            if(contentWidth != undefined && props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const unitWidth = contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio
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
                if(actual.value.totalHeight != undefined || actual.value.top !== 0 || actual.value.height !== 0) {
                    actual.value = {totalHeight: undefined, top: 0, height: 0}
                }
            }
        }, {deep: true})

        //外部事件: 外部指定了滚动位置，指定方式是指定item offset
        watch(navigateRef, itemOffset => {
            if(itemOffset != undefined && propose.value.contentWidth != undefined) {
                const unitWidth = propose.value.contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio
                const expectedRow = Math.floor(itemOffset / props.columnCount)
                const expectedScrollTop = between(0, expectedRow * unitHeight + paddingValue.value.top, propose.value.scrollHeight)
                if(expectedScrollTop !== propose.value.scrollTop) {
                    scrollTo(expectedScrollTop)
                }
                navigateRef.value = undefined
            }
        })

        //功能: 更新view state的值
        function refreshViewState(propose: ProposeData, total: number | undefined, columnCount: number) {
            if(propose.contentWidth != undefined && propose.contentHeight != undefined && props.total != undefined) {
                const unitWidth = propose.contentWidth / columnCount, unitHeight = unitWidth / props.aspectRatio

                //根据可视区域的顶端计算当前首行的行数。四舍五入使首行被计算为"超过一半在可视区域内的行"
                const firstItemRow = Math.round((propose.scrollTop - paddingValue.value.top) / unitHeight)
                const itemOffset = firstItemRow * columnCount
                //同样的方法计算当前尾行的行数
                const lastItemRow = Math.round((propose.scrollTop + propose.contentHeight + paddingValue.value.bottom) / unitHeight)
                const lastItemOffset = Math.min(props.total, lastItemRow * props.columnCount)
                //最后计算出item limit
                const itemLimit = lastItemOffset - itemOffset

                if(propose.scrollTop !== view.state.scrollTop || propose.scrollHeight !== view.state.scrollHeight || itemOffset !== view.state.itemOffset || itemLimit !== view.state.itemLimit) {
                    view.state = {scrollTop: propose.scrollTop, scrollHeight: propose.scrollHeight, itemOffset, itemLimit}
                }
            }
        }

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

function computeOffset(div: HTMLElement, totalHeight: number | undefined, buffer: number, padding: Required<Padding>) {
    //有效内容区域高度。指window的视口高度加上buffer的高度。padding的高度已经包括在window高度内了
    const usableHeight = div.clientHeight + buffer * 2
    //设定的内容卷轴高度。如果没有设定，就假设为预定的显示高度
    const actualTotalHeight = totalHeight ?? usableHeight
    //总的buffer区域高度，指buffer+padding部分的高度
    const sumBufferTop = padding.top + buffer, sumBufferBottom = padding.bottom + buffer

    //结果: 滚动条的偏移量
    const scrollTop = div.scrollTop
    //结果: offsetTop。直接由scrollTop-总buffer高度获得。如果scrollTop<=buffer，表示端点还没有移出缓冲区，因此为0
    const offsetTop = scrollTop <= sumBufferTop ? 0 : scrollTop - sumBufferTop
    //根据scroll的定义，计算scrollBottom的值。它相当于从预定的内容区域bottom到内容卷轴区域bottom的距离
    const scrollBottom = actualTotalHeight - scrollTop - usableHeight + sumBufferTop + sumBufferBottom
    //根据同样的方法计算从下往上的偏移量高度
    const offsetBottom = scrollBottom <= sumBufferBottom ? 0 : scrollBottom - sumBufferBottom
    //结果：offsetHeight。根据totalHeight减去offset可获得
    const offsetHeight = actualTotalHeight - offsetTop - offsetBottom
    //结果: 滚动条的高度。相当于总内容高度减去可视区域中滚动过的部分(clientHeight-paddingTop)
    const scrollHeight = actualTotalHeight - div.clientHeight + padding.top

    return {offsetTop, offsetHeight, scrollHeight, scrollTop}
}

function between(min: number, value: number, max: number): number {
    return value < min ? min : value > max ? max : value
}

interface Padding {
    top?: number
    bottom?: number
    left?: number
    right?: number
}

interface ProposeData { offsetTop: number, offsetHeight: number, scrollTop: number, scrollHeight: number, contentWidth?: number, contentHeight?: number }
interface ActualData { totalHeight?: number, top: number, height: number }