import { defineComponent, inject, PropType } from "vue"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { VirtualRow } from "@/components/VirtualScrollView"
import { annotationContextInjection } from "./inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const { dataEndpoint } = inject(annotationContextInjection)!

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={33} padding={0} bufferSize={10} onUpdate={dataEndpoint.dataUpdate}
                        total={dataEndpoint.data.value.metrics.total} limit={dataEndpoint.data.value.metrics.limit} offset={dataEndpoint.data.value.metrics.offset}>
                <table class="table is-hoverable is-fullwidth">
                    <tbody>
                        {dataEndpoint.data.value.result.map(item => <Item key={item.id} {...item}/>)}
                    </tbody>
                </table>
            </VirtualRow>
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