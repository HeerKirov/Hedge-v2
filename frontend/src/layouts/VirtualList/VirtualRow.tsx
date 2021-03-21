import { computed, defineComponent, PropType } from "vue"
import VirtualList, { AllPadding, UpdateEvent } from "."


export default defineComponent({
    props: {
        padding: null as any as PropType<AllPadding | number>,
        bufferSize: Number,
        rowHeight: Number,
        limit: Number,
        offset: Number,
        total: Number
    },
    emits: {
        update: (_offset: number, _limit: number) => true
    },
    setup(props, { emit, slots }) {
        const lastUpdateData: {offsetTop?: number, offsetHeight?: number} = {}

        const onUpdate = ({ offsetTop, offsetHeight }: UpdateEvent) => {
            if(offsetTop !== lastUpdateData.offsetTop || offsetHeight !== lastUpdateData.offsetHeight) {
                lastUpdateData.offsetTop = offsetTop
                lastUpdateData.offsetHeight = offsetHeight
                const rowHeight = props.rowHeight ?? 0
                const offset = Math.floor(offsetTop / rowHeight)
                const limit = Math.ceil((offsetTop + offsetHeight) / rowHeight) - offset
                emit("update", offset, limit)
            }
        }

        const buffer = computed(() => (props.bufferSize ?? 0) * (props.rowHeight ?? 0))
        const minUpdateDelta = computed(() => props.bufferSize && props.rowHeight ? Math.ceil(props.bufferSize / 2) * props.rowHeight : undefined)

        return () => {
            const rowHeight = props.rowHeight ?? 0
            const totalHeight = props.total != undefined ? props.total * rowHeight : undefined
            const actualOffsetTop = props.offset != undefined ? props.offset * rowHeight : undefined
            const actualOffsetHeight = props.limit != undefined ? props.limit * rowHeight : undefined

            return <VirtualList padding={props.padding} buffer={buffer.value} minUpdateDelta={minUpdateDelta.value} onUpdate={onUpdate}
                                totalHeight={totalHeight} actualOffsetTop={actualOffsetTop} actualOffsetHeight={actualOffsetHeight}>
                {slots.default?.()}
            </VirtualList>
        }
    }
})