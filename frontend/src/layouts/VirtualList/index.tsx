import { computed, defineComponent, onMounted, PropType, ref } from "vue"
import { watchElementResize } from "@/functions/document/observer"
import style from "./style.module.scss"

export interface UpdateEvent {
    offsetTop: number
    offsetHeight: number
    contentWidth: number
    contentHeight: number
}

/**
 * 虚拟滚动列表组件。
 * 此组件提供十分原始的虚拟滚动基础支持。指定一个内容总高度，列表会在滚动或尺寸改变时发出通知，告知需要的内容区域的offset和height。
 * 使用方提供内容和实际内容的top/height，虚拟组件来计算这些内容在当前的scroll区间中应该显示的位置。
 * TODO loading提示
 * TODO 提供将scroll重置回0的方法
 */
export default defineComponent({
    props: {
        /**
         * 位于滚动区域和内容中夹着的padding。这部分padding会被自动算入容器高度。
         */
        padding: null as any as PropType<AllPadding | number>,
        /**
         * 位于可视范围外的缓冲区大小。
         */
        buffer: null as any as PropType<VerticalPadding | number>,
        /**
         * 虚拟列表内容的总高度。如果未设置，就假设总高度和视口大小一样高。
         */
        totalHeight: Number,
        /**
         * 触发事件的最小变化阈值。当累计属性变化量小于此值时，事件不会触发。
         * 设置合理的值，能大量减少无效的事件触发。只要阈值不超过缓冲区大小或内容元素尺寸即可。
         */
        minUpdateDelta: Number,
        /**
         * 当前slot给出的内容，在虚拟列表中的实际offset top。如果不给，默认为0。
         */
        actualOffsetTop: Number,
        /**
         * 当前slot给出的内容，在虚拟列表中的实际offset height。如果不给，默认为0。
         */
        actualOffsetHeight: Number
    },
    emits: ["update"],
    setup(props, { emit, slots }) {
        const scrollDivRef = ref<HTMLDivElement>()
        const contentDivRef = ref<HTMLDivElement>()

        const { paddingValue, bufferValue, paddingStyle } = usePaddingProperties(props)

        //当前的属性
        const data: CacheData = {offsetTop: 0, offsetHeight: 0, contentWidth: 0, contentHeight: 0}
        //上次触发事件时的属性
        let lastData: CacheData | null = null

        function emitEvent() {
            if(props.minUpdateDelta) {
                if(lastData == null) {
                    lastData = {...data}
                    emit("update", data)
                }else if(Math.abs(lastData.offsetTop - data.offsetTop) >= props.minUpdateDelta ||
                    Math.abs(lastData.offsetHeight - data.offsetHeight) >= props.minUpdateDelta ||
                    Math.abs(lastData.contentWidth - data.contentWidth) >= props.minUpdateDelta ||
                    Math.abs(lastData.contentHeight - data.contentHeight) >= props.minUpdateDelta) {
                    lastData.offsetTop = data.offsetTop
                    lastData.offsetHeight = data.offsetHeight
                    lastData.contentWidth = data.contentWidth
                    lastData.contentHeight = data.contentHeight
                    emit("update", data)
                }
            }else{
                emit("update", data)
            }
        }

        function computeOffset(div: HTMLDivElement) {
            //可见的显示高度。指window的视口高度加上buffer的高度。padding的高度已经包括在window高度内了
            const clientHeight = div.clientHeight + bufferValue.value.top + bufferValue.value.bottom
            //设定的内容卷轴高度。如果没有设定，就假设为预定的显示高度
            const totalHeight = props.totalHeight ?? clientHeight
            //总的buffer区域高度，指buffer+padding部分的高度
            const sumBufferTop = paddingValue.value.top + bufferValue.value.top, sumBufferBottom = paddingValue.value.bottom + bufferValue.value.bottom

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

        const onScroll = (e: Event) => {
            //发生滚动时，触发offset重算
            const { offsetTop, offsetHeight } = computeOffset(e.target as HTMLDivElement)
            if(offsetTop !== data.offsetTop || offsetHeight !== data.offsetHeight) {
                data.offsetTop = offsetTop
                data.offsetHeight = offsetHeight
                emitEvent()
            }
        }

        watchElementResize(scrollDivRef, ({ width, height }) => {
            //显示区域大小发生变化时，修改contentHeight，并有可能触发offset重算
            //此外，挂载时，也会触发一次，相当于初始化
            let changed = false
            if(width !== data.contentWidth) {
                changed = true
                data.contentWidth = width
            }
            if(height !== data.contentHeight) {
                changed = true
                data.contentHeight = height
                if(scrollDivRef.value) {
                    const { offsetTop, offsetHeight } = computeOffset(scrollDivRef.value)
                    data.offsetTop = offsetTop
                    data.offsetHeight = offsetHeight
                }
            }
            if(changed) emitEvent()
        })

        const actualOffsetStyle = computed(() => {
            const actualOffsetTop = props.actualOffsetTop ?? 0
            const actualOffsetHeight = props.actualOffsetHeight ?? 0
            const totalHeight = props.totalHeight ?? (scrollDivRef.value ? scrollDivRef.value.clientHeight + bufferValue.value.top + bufferValue.value.bottom : 0)
            return {
                paddingTop: `${actualOffsetTop}px`,
                paddingBottom: `${totalHeight - actualOffsetTop - actualOffsetHeight}px`
            }
        })

        return () => <div ref={scrollDivRef} class={style.scrollList} style={paddingStyle.value} onScroll={onScroll}>
            <div ref={contentDivRef} class={style.scrollContent} style={actualOffsetStyle.value}>
                {slots.default?.()}
            </div>
        </div>
    }
})

function usePaddingProperties(props: { padding?: AllPadding | number, buffer?: VerticalPadding | number }) {
    const paddingValue = computed(() => ({
        top: typeof props.padding === "number" ? props.padding : props.padding?.top ?? 0,
        bottom: typeof props.padding === "number" ? props.padding : props.padding?.bottom ?? 0,
        left: typeof props.padding === "number" ? props.padding : props.padding?.left ?? 0,
        right: typeof props.padding === "number" ? props.padding : props.padding?.right ?? 0
    }))
    const bufferValue = computed(() => ({
        top: (typeof props.buffer === "number" ? props.buffer : props.buffer?.top ?? 0),
        bottom: (typeof props.buffer === "number" ? props.buffer : props.buffer?.bottom ?? 0),
    }))
    const paddingStyle = computed(() => ({
        paddingTop: `${paddingValue.value.top ?? 0}px`,
        paddingBottom: `${paddingValue.value.bottom ?? 0}px`,
        paddingLeft: `${paddingValue.value.left ?? 0}px`,
        paddingRight: `${paddingValue.value.right ?? 0}px`,
    }))

    return {paddingValue, bufferValue, paddingStyle}
}

interface VerticalPadding { top?: number, bottom?: number }
interface HorizontalPadding { left?: number, right?: number }
type AllPadding = VerticalPadding & HorizontalPadding

interface CacheData { offsetTop: number, offsetHeight: number, contentWidth: number, contentHeight: number }