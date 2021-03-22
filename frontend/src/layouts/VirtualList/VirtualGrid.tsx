import { computed, defineComponent, PropType } from "vue"
import VirtualList, { AllPadding, UpdateEvent } from "."

export default defineComponent({
    props: {
        padding: null as any as PropType<AllPadding | number>,
        buffer: {type: Number, default: 0},
        columnCount: {type: Number, default: 3},
        aspectRatio: {type: Number, default: 1},
        limit: Number,
        offset: Number,
        total: Number
    },
    emits: {
        update: (_offset: number, _limit: number) => true
    },
    setup(props, { emit, slots }) {
        const lastUpdateData: {offsetTop?: number, offsetHeight?: number, contentWidth?: number} = {}

        const onUpdate = ({ offsetTop, offsetHeight, contentWidth }: UpdateEvent) => {
            if(offsetTop !== lastUpdateData.offsetTop || offsetHeight !== lastUpdateData.offsetHeight || contentWidth !== lastUpdateData.contentWidth) {
                lastUpdateData.offsetTop = offsetTop
                lastUpdateData.offsetHeight = offsetHeight
                lastUpdateData.contentWidth = contentWidth

                const unitWidth = contentWidth / props.columnCount
                const unitHeight = unitWidth / props.aspectRatio

                const offset = Math.floor(offsetTop / unitHeight) * props.columnCount
                const limit = Math.ceil((offsetTop + offsetHeight) / unitHeight) * props.columnCount - offset
                emit("update", offset, limit)
            }
        }

        const minUpdateDelta = computed(() => props.buffer ? Math.ceil(props.buffer / 2) : undefined)

        return () => {
            if(lastUpdateData.contentWidth && props.total != undefined && props.offset != undefined && props.limit != undefined) {
                const unitWidth = lastUpdateData.contentWidth / props.columnCount
                const unitHeight = lastUpdateData.contentWidth / props.columnCount / props.aspectRatio
                //首行前要空出的unit的数量
                const beginOffsetUnit = props.offset % props.columnCount
                const beginOffset = beginOffsetUnit * unitWidth
                const totalHeight = Math.ceil(props.total / props.columnCount) * unitHeight
                const actualOffsetTop = Math.floor((props.offset - beginOffsetUnit) / props.columnCount) * unitHeight
                const actualOffsetHeight = Math.ceil((props.limit + beginOffsetUnit) / props.columnCount) * unitHeight

                return <VirtualList padding={props.padding} buffer={props.buffer} minUpdateDelta={minUpdateDelta.value} onUpdate={onUpdate}
                                    totalHeight={totalHeight} actualOffsetTop={actualOffsetTop} actualOffsetHeight={actualOffsetHeight}>
                    {beginOffset > 0 ? <div style={{width: `${beginOffset}px`, height: `${unitHeight}px`}}/> : undefined}
                    {slots.default?.()}
                </VirtualList>
            }else{
                return <VirtualList padding={props.padding} buffer={props.buffer} minUpdateDelta={minUpdateDelta.value} onUpdate={onUpdate}>
                    {slots.default?.()}
                </VirtualList>
            }


        }
    }
})