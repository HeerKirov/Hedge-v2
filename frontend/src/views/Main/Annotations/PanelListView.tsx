import { defineComponent, PropType, ref } from "vue"
import { Annotation, AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { VirtualRow } from "@/components/VirtualScrollView"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<Annotation[]>, required: true}
    },
    setup(props) {
        const data = ref<{limit: number, offset: number, total: number | undefined, data: Annotation[]}>({limit: 0, offset: 0, total: undefined, data: []})

        const dataUpdate = async (offset: number, limit: number) => {
            const r = await mockData(offset, limit)
            //tips: 在更上一层的hooks，需要进行节流，防止过时数据产生覆盖
            data.value = {offset, limit: r.data.length, total: r.total, data: r.data}
        }

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataUpdate}
                        total={data.value.total} limit={data.value.limit} offset={data.value.offset}>
                <table class="table is-hoverable is-fullwidth">
                    <tbody>
                        {data.value.data.map(item => <Item key={item.id} {...item}/>)}
                    </tbody>
                </table>
            </VirtualRow>
        </div>
    }
})

const mockedTotal = 100
const mockedData: Annotation[] = Array(mockedTotal).fill(0).map((_, i) => ({ id: i, name: `注解${i}`, canBeExported: i % 3 === 0, target: ["AUTHOR", "WORK", "CHARACTER"] }))

function mockData(offset: number, limit: number): Promise<{total: number, data: Annotation[]}> {
    return new Promise(resolve => {
        setTimeout(() => resolve({total: mockedTotal, data: mockedData.slice(offset, limit + offset)}), 20)
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