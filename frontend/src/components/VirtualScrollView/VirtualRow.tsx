import { defineComponent, PropType, watch } from "vue"
import { Padding, ProposeData, useBasicVirtualComponent } from "./basic"

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
         * 每个行的高度。
         */
        rowHeight: {type: Number, default: 0},
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
         * 最小更新变化阈值，单位是行。当limit和offset的变化值小于此阈值时，将不会发出事件。
         */
        minUpdateDelta: {type: Number, default: 0}
    },
    emits: {
        update: (_offset: number, _limit: number) => true
    },
    setup(props, { emit, slots }) {
        const { propose, actual, padding, render, setViewState, watchViewNavigation } = useBasicVirtualComponent({
            props: {
                padding() { return props.padding },
                buffer() { return props.bufferSize * props.rowHeight }
            }
        })

        //上层事件: 将total设置有效值会刷新view state的值
        watch(() => props.total, (total, oldTotal) => {
            if(total != undefined && oldTotal !== total) {
                updateViewState(propose.value)
            }
        })

        //上层事件: propose发生变化时，重新计算view，以及发送update事件
        const lastDataRequired: {offset?: number, limit?: number} = {}
        watch(propose, (propose, oldPropose) => {
            //计算请求数据的limit和offset是否有变，并发出事件
            if(lastDataRequired.offset == undefined || lastDataRequired.limit == undefined
                || propose.offsetTop !== oldPropose.offsetTop
                || propose.offsetHeight !== oldPropose.offsetHeight) {

                const offset = Math.floor(propose.offsetTop / props.rowHeight)
                const limit = Math.ceil((propose.offsetTop + propose.offsetHeight) / props.rowHeight) - offset
                if(lastDataRequired.offset == undefined || lastDataRequired.limit == undefined
                    || Math.abs(lastDataRequired.offset - offset) > props.minUpdateDelta
                    || Math.abs(lastDataRequired.limit - limit) > props.minUpdateDelta) {
                    lastDataRequired.offset = offset
                    lastDataRequired.limit = limit
                    emit("update", offset, limit)
                }
            }

            //计算作为导航的view的值
            if(propose.scrollTop !== oldPropose.scrollTop || propose.scrollHeight !== oldPropose.scrollHeight) {
                updateViewState(propose)
            }
        })

        //外部事件: 属性重设时，根据data actual重新计算actual
        watch(() => props, props => {
            if(props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const totalHeight = props.total * props.rowHeight
                const actualOffsetTop = props.offset * props.rowHeight
                const actualOffsetHeight = props.limit * props.rowHeight
                actual.value = {totalHeight, top: actualOffsetTop, height: actualOffsetHeight}
            }else{
                if(actual.value.totalHeight != undefined || actual.value.top !== 0 || actual.value.height !== 0) {
                    actual.value = {totalHeight: undefined, top: 0, height: 0}
                }
            }
        }, {deep: true})

        //外部事件: 外部指定了滚动位置，指定方式是指定item offset
        watchViewNavigation(itemOffset => itemOffset * props.rowHeight)

        //功能: 更新view state的值
        function updateViewState(propose: ProposeData) {
            if(propose.contentHeight != undefined) {
                //根据可视区域的顶端计算当前首行的行数。四舍五入使首行被计算为"超过一半在可视区域内的行"
                const firstItemOffset = Math.round((propose.scrollTop - padding.top) / props.rowHeight)
                //同样的方法计算当前尾行的行数
                const lastItemOffset = Math.round((propose.scrollTop + propose.contentHeight + padding.bottom) / props.rowHeight)

                setViewState(firstItemOffset, lastItemOffset - firstItemOffset)
            }
        }

        return () => render(slots.default?.())
    }
})