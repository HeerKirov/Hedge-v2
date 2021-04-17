import { computed, inject, InjectionKey, provide, reactive, readonly, Ref, ref, watch } from "vue"
import { watchElementResize } from "@/functions/utils/element"
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
    /**
     * 当前的数据项总数量。
     */
    itemTotal: number | undefined
}

interface ScrollStateView { state: ScrollState }
export interface ScrollView extends ScrollStateView { navigateTo(itemOffset: number) }
interface ScrollStateViewConsumer {
    view: ScrollView
    navigateRef: Ref<number | undefined>
}

interface BasicVirtualComponentOptions {
    props: {
        padding(): Padding | number
        buffer(): number
    }
    onRefresh?()
}

export function useScrollView(): Readonly<ScrollView> {
    const parent = inject(scrollControllerInjection, undefined)
    if(parent != undefined) {
        return readonly(parent.view)
    }
    const navigateRef = ref<number | undefined>(undefined)
    const view = reactive({
        state: {
            scrollTop: 0,
            scrollHeight: 0,
            itemOffset: 0,
            itemLimit: 0,
            itemTotal: undefined
        },
        navigateTo(itemOffset) {
            navigateRef.value = itemOffset
        }
    })
    provide(scrollControllerInjection, { view, navigateRef })
    return readonly(view)
}

export function useBasicVirtualComponent({ props, onRefresh }: BasicVirtualComponentOptions) {
    const scrollDivRef = ref<HTMLElement>()
    const { padding, paddingStyle } = getPaddingProperties(props.padding())
    const { view, navigateRef } = inject(scrollControllerInjection, () => ({
        view: reactive({state: {scrollTop: 0, scrollHeight: 0, itemOffset: 0, itemLimit: 0, itemTotal: undefined}, navigateTo() {}}),
        navigateRef: ref<number>()
    }), true)

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

    const actualOffsetStyle = computed(() => {
        return ({
            height: `${actual.value.height.toFixed(3)}px`,
            paddingTop: `${actual.value.top.toFixed(3)}px`,
            paddingBottom: `${((actual.value.totalHeight ?? 0) - actual.value.top - actual.value.height).toFixed(3)}px`
        })
    })

    //底层事件: 发生滚动事件时重新计算propose offset
    const onScroll = (e: Event) => {
        //发生滚动时，触发offset重算
        if(actual.value.totalHeight != undefined) {
            const c = computeOffset(e.target as HTMLDivElement, actual.value.totalHeight, props.buffer(), padding)
            propose.value = {...propose.value, ...c}
        }
    }

    //底层事件: 区域大小改变时重新计算propose.
    //机制: 挂载时也会触发一次，作为初始化
    watchElementResize(scrollDivRef, ({ width, height }) => {
        //显示区域大小发生变化时，修改contentHeight，并有可能触发offset重算
        //此外，挂载时，也会触发一次，相当于初始化
        if(height !== propose.value.contentHeight && scrollDivRef.value) {
            const c = computeOffset(scrollDivRef.value, actual.value.totalHeight, props.buffer(), padding)
            propose.value = {contentWidth: width, contentHeight: height, ...c}
        }else{
            propose.value = {...propose.value, contentWidth: width, contentHeight: height}
        }
    })

    //机制: 将totalHeight设为undefined触发重刷
    watch(() => actual.value.totalHeight, totalHeight => {
        //把totalHeight设置为undefined，会被认为是重设了内容，因此会把卷轴滚动回顶端，同时触发数据重刷
        if(totalHeight == undefined && scrollDivRef.value) {
            const c = computeOffset(scrollDivRef.value, totalHeight, props.buffer(), padding)
            scrollDivRef.value.scrollTo({top: 0, behavior: "auto"})
            onRefresh?.()
            propose.value = {...propose.value, ...c}
        }
    })

    //功能: 滚动到目标位置
    function scrollTo(scrollTop: number) {
        if(scrollDivRef.value) {
            scrollDivRef.value.scrollTo({top: scrollTop, behavior: "auto"})
        }
    }

    //功能: 更新view state的值。只需要提供itemOffset和itemLimit即可，scroll的值自动取出
    function setViewState(itemOffset: number, itemLimit: number, itemTotal: number | undefined) {
        if(propose.value.scrollTop !== view.state.scrollTop || propose.value.scrollHeight !== view.state.scrollHeight ||
            itemOffset !== view.state.itemOffset || itemLimit !== view.state.itemLimit || itemTotal !== view.state.itemTotal) {
            view.state = {scrollTop: propose.value.scrollTop, scrollHeight: propose.value.scrollHeight, itemOffset, itemLimit, itemTotal}
        }
    }

    //监听事件: 外部指定了新的item offset。需要返回scrollTop(不需要考虑padding)
    function watchViewNavigation(event: (itemOffset: number) => number | void) {
        watch(navigateRef, itemOffset => {
            if(itemOffset != undefined && propose.value.contentWidth != undefined) {
                const expectedScrollTop = event(itemOffset)

                if(expectedScrollTop != undefined) {
                    const scrollTop = expectedScrollTop + padding.top
                    if(scrollTop !== propose.value.scrollTop) {
                        scrollTo(scrollTop)
                    }
                }
            }
            navigateRef.value = undefined
        })
    }

    //渲染函数
    const render = (slot: JSX.Element | undefined) => <div ref={scrollDivRef} class={style.scrollList} style={paddingStyle} onScroll={onScroll}>
        <div class={style.scrollContent} style={actualOffsetStyle.value}>
            {slot}
        </div>
    </div>

    return {propose, actual, padding, render, scrollTo, setViewState, watchViewNavigation}
}

function getPaddingProperties(originPaddingValue: Padding | number) {
    const padding = {
        top: typeof originPaddingValue === "number" ? originPaddingValue : originPaddingValue?.top ?? 0,
        bottom: typeof originPaddingValue === "number" ? originPaddingValue : originPaddingValue?.bottom ?? 0,
        left: typeof originPaddingValue === "number" ? originPaddingValue : originPaddingValue?.left ?? 0,
        right: typeof originPaddingValue === "number" ? originPaddingValue : originPaddingValue?.right ?? 0
    }
    const paddingStyle = {
        paddingTop: `${padding.top ?? 0}px`,
        paddingBottom: `${padding.bottom ?? 0}px`,
        paddingLeft: `${padding.left ?? 0}px`,
        paddingRight: `${padding.right ?? 0}px`,
    }

    return {padding, paddingStyle}
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

export interface Padding {
    top?: number
    bottom?: number
    left?: number
    right?: number
}

export interface ProposeData {
    offsetTop: number,
    offsetHeight: number,
    scrollTop: number,
    scrollHeight: number,
    contentWidth?: number,
    contentHeight?: number
}

interface ActualData {
    totalHeight?: number,
    top: number,
    height: number
}

const scrollControllerInjection: InjectionKey<ScrollStateViewConsumer> = Symbol()
