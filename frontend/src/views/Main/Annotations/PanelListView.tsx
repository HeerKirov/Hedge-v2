import { defineComponent, PropType, ref } from "vue"
import { Annotation, AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import VirtualList, { UpdateEvent } from "@/layouts/VirtualList"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<Annotation[]>, required: true}
    },
    setup(props) {
        // return () => <div>
        //     <table class="table is-hoverable is-fullwidth">
        //         <tbody>
        //             {props.items.map(item => <Item key={item.id} {...item}/>)}
        //         </tbody>
        //     </table>
        // </div>
        const data = ref<{limit: number, offset: number, total: number | undefined, data: number[]}>({limit: 0, offset: 0, total: undefined, data: []})

        const dataUpdate = async (offset: number, limit: number) => {
            const r = await mockData(offset, limit)
            //tips: 在更上一层的hooks，需要进行节流，防止过时数据产生覆盖
            data.value = {offset, limit, total: r.total, data: r.data}
        }

        return () => <div class="w-100 h-100">
            <AnnotationRowList onUpdate={dataUpdate} {...data.value}/>
        </div>
    }
})

interface VirtualRowListOptions<T> {
    padding?: number
    buffer?: number
    minUpdateDelta?: number
    rowHeight: number
    render(item: T): JSX.Element
}

function virtualRowList<T>(options: VirtualRowListOptions<T>) {
    //TODO 可以更改为更自然的slot组件形态，而减少/不使用高阶组件特性
    //TODO 做成独立组件
    return defineComponent({
        props: {
            limit: Number,
            offset: Number,
            total: Number,
            data: null as any as PropType<T[]>
        },
        emits: {
            update: (_offset: number, _limit: number) => true
        },
        setup(props, { emit }) {
            const onUpdate = ({ offsetTop, offsetHeight }: UpdateEvent) => {
                const offset = Math.floor(offsetTop / options.rowHeight)
                const limit = Math.ceil((offsetTop + offsetHeight) / options.rowHeight) - offset
                emit("update", offset, limit)
            }

            return () => {
                const totalHeight = props.total != undefined ? props.total * options.rowHeight : undefined
                const actualOffsetTop = props.offset != undefined ? props.offset * options.rowHeight : undefined
                const actualOffsetHeight = props.limit != undefined ? props.limit * options.rowHeight : undefined

                return <VirtualList padding={options.padding} buffer={options.buffer} minUpdateDelta={options.minUpdateDelta} onUpdate={onUpdate}
                                    totalHeight={totalHeight} actualOffsetTop={actualOffsetTop} actualOffsetHeight={actualOffsetHeight}>
                    {props.data?.map(options.render)}
                </VirtualList>
            }
        }
    })
}

const AnnotationRowList = virtualRowList({
    padding: 12,
    buffer: 150,
    minUpdateDelta: 60,
    rowHeight: 60,
    render(item: number) {
        return <div key={item} style="height: 55px; margin-bottom: 5px" class="block w-100">{item}</div>
    }
})

async function mockData(offset: number, limit: number): Promise<{total: number, data: number[]}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({total: 100, data: Array(limit).fill(0).map((_, i) => offset + i)}), 50)
    })
}

/**
 * 列表项视图中的项。
 */
const Item = defineComponent({
    props: {
        id: {type: Number, required: true},
        name: {type: String, required: true},
        target: {type: null as any as PropType<AnnotationTarget[]>, required: true},
        canBeExported: {type: Boolean, required: true}
    },
    setup(props) {
        return () => <tr>
            <td class="is-width-50"><b class="ml-1">[</b><span class="mx-1">{props.name}</span><b>]</b></td>
            <td class="is-width-15">{(props.canBeExported || null) && <i class="fa fa-share-square is-danger"/>}</td>
            <td class="is-width-35">
                <AnnotationTargetElement target={props.target}/>
            </td>
        </tr>
    }
})

const AnnotationTargetElement = defineComponent({
    props: {
        target: {type: null as any as PropType<AnnotationTarget[]>, required: true},
    },
    setup(props) {
        const TARGET_TYPE_TAG: {[key in AnnotationTarget]: string} = {
            "TAG": "tag",
            "TOPIC": "hashtag",
            "AUTHOR": "user-tag",
            "ARTIST": "paint-brush",
            "STUDIO": "swatchbook",
            "PUBLISH": "stamp",
            "COPYRIGHT": "copyright",
            "WORK": "bookmark",
            "CHARACTER": "user-ninja"
        }

        return () => <span>
            {props.target.map(t => <i class={`fa fa-${TARGET_TYPE_TAG[t]} mr-2`}/>)}
        </span>
    }
})