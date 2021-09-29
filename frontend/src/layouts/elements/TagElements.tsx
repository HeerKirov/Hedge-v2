import { defineComponent, PropType } from "vue"
import { TagLink } from "@/functions/adapter-http/impl/tag"
import { TagNodeElement } from "./MetaTagElements"

export const TagLinkElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagLink>, required: true},
        showCloseButton: Boolean
    },
    emits: {
        click: () => true,
        delete: () => true
    },
    setup(props, { emit }) {
        const click = () => emit("click")
        const del = () => emit("delete")

        return () => <p class="flex mb-1">
            <span class="tag mr-1"><i class="fa fa-link"/></span>
            <TagNodeElement node={props.value} onClick={click}/>
            {props.showCloseButton && <a class="tag ml-1" onClick={del}><i class="fa fa-times"/></a>}
        </p>
    }
})
