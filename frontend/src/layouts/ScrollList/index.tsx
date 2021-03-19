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
 * TODO 节流机制
 *      可以考虑的节流机制有：
 *      - 距离节流。滚动/尺寸变化的变化量小于一定阈值时，不发出事件，直到超过阈值时一口气更新。
 *        如果使用这个机制，需要注意，可能存在部分属性变化量小于阈值，而另外的属性变化量大于阈值的情况，更新时必须保证所有的属性都更新。
 *        这应该是最平滑的节流方案，只要阈值不太大(比缓冲区小即可，和元素高度差不多)，加上有缓冲区，根本不可能看出来。
 *      - 时间节流。滚动/尺寸变化后触发一个计时器，在计时结束后才触发事件，中间的变化都不触发事件。
 *        这个机制可能会看起来卡顿，如果短时间内变化量太大的话。
 *      - 另一个时间节流。发生变化后触发一个计时器，每次变化都重新计时，计时结束(相当于计时时间内不再变化)时触发事件。
 *        只供参考。这个看起来更加没谱，如果一直保持变化，就一直不会更新。
 * TODO 实际显示机制
 *      目前已完成的是向父组件通知虚拟列表期望中的内容的offset和height，接下来需要处理父组件提供内容更新的情况。
 *      这个情况并不是简单修改一下slot的内容就行了的。
 *      - 实际供给的组件范围极大可能与期望值对不上号，height要根据组件的实际高度来的，这一般都不会一致的。
 *      - 异步更新机制。父组件极大可能要异步、延迟地提供更新。异步更新时列表还可能要有loading。
 *      因此，虚拟滚动列表的实际显示，必须根据当前实际内容和实际值提供显示。
 *      因此实际上虚拟滚动列表的运作方式是，通过事件告知使用者自己期望的范围，而使用者提供的实际值和这个期望值是没有关系的，
 *      因此使用者必须同时提供内容、实际内容的offset和height，虚拟组件来计算这些内容在当前的scroll区间中应该显示的位置。
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
        totalHeight: Number
    },
    emits: ["update"],
    setup(props, { emit, slots }) {
        const scrollDivRef = ref<HTMLDivElement>()
        const contentDivRef = ref<HTMLDivElement>()

        const { paddingValue, bufferValue, paddingStyle } = usePaddingProperties(props)

        const data = {offsetTop: 0, offsetHeight: 0, contentWidth: 0, contentHeight: 0}

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
                emit("update", data)
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
            if(changed) emit("update", data)
        })

        return () => <div ref={scrollDivRef} class={style.scrollList} style={paddingStyle.value} onScroll={onScroll}>
            <div ref={contentDivRef} class={style.scrollContent}>
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