import { computed, defineComponent, PropType, ref, watch } from "vue"
import { Padding, ProposeData, useBasicVirtualComponent } from "./basic"
import { numbers } from "@/utils/primitives"

export default defineComponent({
    props:{
        /**
         * 位于滚动区域和内容中夹着的padding。这部分padding会被自动算入容器高度。
         */
        padding: {type: null as any as PropType<Padding | number>, default: 0},
        /**
         * 位于可视范围外的缓冲区行数。
         */
        bufferSize: {type: Number, default: 0},
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
        update: (_: number, __: number) => true
    },
    setup(props, { emit, slots }) {
        const { propose, actual, padding, render, scrollTo, setViewState, watchViewNavigation } = useBasicVirtualComponent({
            props: {
                padding() { return props.padding },
                buffer() { return buffer.value }
            },
            onRefresh() {
                lastDataRequired.offset = undefined
                lastDataRequired.limit = undefined
            }
        })

        const DEFAULT_CONTENT_WIDTH = 1000
        const buffer = computed(() => props.bufferSize * (propose.value.contentWidth ?? DEFAULT_CONTENT_WIDTH) / props.columnCount / props.aspectRatio)

        //上层事件: 将total设置有效值会刷新view state的值
        watch(() => props.total, (total, oldTotal) => {
            if(total != undefined && oldTotal !== total) {
                updateViewState(propose.value, total, props.columnCount)
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
                    const oldFirstItemRow = Math.round((oldPropose.scrollTop - padding.top) / oldUnitHeight)
                    const oldItemOffset = oldFirstItemRow * oldColumnCount
                    //计算上次首行相对于可视区域上界的偏移量
                    const oldFirstItemRowOffset = oldFirstItemRow * oldUnitHeight - (oldPropose.scrollTop - padding.top)

                    //接下来依据偏移量反推新的scrollTop预期值
                    const unitWidth = propose.contentWidth / columnCount, unitHeight = unitWidth / props.aspectRatio
                    const expectedFirstItemRow = Math.floor(oldItemOffset / columnCount)
                    const expectedScrollTop = numbers.between(0, unitHeight * expectedFirstItemRow - oldFirstItemRowOffset + padding.top, propose.scrollHeight)

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
                        || Math.abs(lastDataRequired.offset - offset) >= minUpdateDelta
                        || Math.abs(lastDataRequired.limit - limit) >= minUpdateDelta) {
                        lastDataRequired.offset = offset
                        lastDataRequired.limit = limit
                        emit("update", offset, limit)
                    }
                }

                //计算作为导航的view的值
                if(propose.scrollTop !== oldPropose.scrollTop || propose.scrollHeight !== oldPropose.scrollHeight) {
                    updateViewState(propose, props.total, columnCount)
                }
            }
        })

        const firstOffsetStyle = ref<{width: string, height: string}>()
        //外部事件: 属性重设时，根据data actual重新计算actual
        watch(() => [props, propose.value.contentWidth] as [typeof props, number | undefined], ([props, contentWidth]) => {
            if(contentWidth != undefined && props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const unitWidth = contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio
                //首行前要空出的unit的数量
                const beginOffsetUnit = props.offset % props.columnCount
                const firstOffset = beginOffsetUnit * unitWidth

                const totalHeight = Math.ceil(props.total / props.columnCount) * unitHeight
                const actualOffsetTop = Math.floor((props.offset - beginOffsetUnit) / props.columnCount) * unitHeight
                const actualOffsetHeight = Math.ceil((props.limit + beginOffsetUnit) / props.columnCount) * unitHeight

                firstOffsetStyle.value = {width: `${firstOffset}px`, height: '1px'}
                actual.value = {totalHeight, top: actualOffsetTop, height: actualOffsetHeight}
            }else{
                firstOffsetStyle.value = undefined
                if(actual.value.totalHeight != undefined || actual.value.top !== 0 || actual.value.height !== 0) {
                    actual.value = {totalHeight: undefined, top: 0, height: 0}
                }
            }
        }, {deep: true})

        //外部事件: 外部指定了滚动位置，指定方式是指定item offset
        watchViewNavigation(itemOffset => {
            if(propose.value.contentWidth != undefined) {
                const unitWidth = propose.value.contentWidth / props.columnCount, unitHeight = unitWidth / props.aspectRatio
                const expectedRow = Math.floor(itemOffset / props.columnCount)
                return [expectedRow * unitHeight, unitHeight]
            }
            return undefined
        })

        //功能: 更新view state的值
        function updateViewState(propose: ProposeData, total: number | undefined, columnCount: number) {
            if(propose.contentWidth != undefined && propose.contentHeight != undefined && total != undefined) {
                const unitWidth = propose.contentWidth / columnCount, unitHeight = unitWidth / props.aspectRatio

                //根据可视区域的顶端计算当前首行的行数。四舍五入使首行被计算为"超过一半在可视区域内的行"
                const firstItemRow = Math.round((propose.scrollTop - padding.top) / unitHeight)
                const itemOffset = firstItemRow * columnCount
                //同样的方法计算当前尾行的行数
                const lastItemRow = Math.round((propose.scrollTop + propose.contentHeight + padding.bottom) / unitHeight)
                const lastItemOffset = Math.min(total, lastItemRow * props.columnCount)
                //最后计算出item limit
                const itemLimit = lastItemOffset - itemOffset

                setViewState(itemOffset, itemLimit, total)
            }else if(total == undefined) {
                setViewState(0, 0, undefined)
            }
        }

        return () => render(<>
            {firstOffsetStyle.value ? <div style={firstOffsetStyle.value}/> : undefined}
            {slots.default?.()}
        </>)
    }
})
