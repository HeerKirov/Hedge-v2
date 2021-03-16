import { defineComponent, PropType } from "vue"
import { Annotation, AnnotationTarget } from "@/functions/adapter-http/impl/annotations"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<Annotation[]>, required: true}
    },
    setup(props) {
        return () => <div>
            <table class="table is-hoverable is-fullwidth">
                <tbody>
                    {props.items.map(item => <Item key={item.id} {...item}/>)}
                </tbody>
            </table>
        </div>
    }
})

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
        const AUTHOR_TYPE_TAG = {
            "artist": <><i class="fa fa-paint-brush mr-2"/><span class="mr-2">画师</span></>,
            "studio": <><i class="fa fa-swatchbook mr-2"/><span class="mr-2">工作室</span></>,
            "publication": <><i class="fa fa-stamp mr-2"/><span class="mr-2">出版物</span></>
        }

        return () => <tr>
            <td class="is-width-50"><b>[</b><span class="mx-1">{props.name}</span><b>]</b></td>
            <td class="is-width-10">{(props.canBeExported || null) && <i class="fa fa-share-square is-danger"/>}</td>
            <td class="is-width-40">
                {props.target?.map(a => <span class="tag mr-1">{a}</span>)}
            </td>
        </tr>
    }
})

const AnnotationTargetElement = defineComponent({
    props: {
        target: {type: null as any as PropType<AnnotationTarget[]>, required: true},
    },
    setup(props) {

    }
})