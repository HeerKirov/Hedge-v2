import { defineComponent, PropType } from "vue"
import { TagNodeElement } from "@/layouts/display-components/MetaTagElement"
import { IsGroup, TagLink, TagType } from "@/functions/adapter-http/impl/tag"

export const TagTypeDisplay = defineComponent({
    props: {
        value: {type: null as any as PropType<TagType>, required: true}
    },
    setup(props) {
        return () => TAG_TYPE_CONTENT[props.value]
    }
})

const TAG_TYPE_CONTENT: {[key in TagType]: JSX.Element} = {
    "TAG": <p><i class="fa fa-tag mr-1"/>标签</p>,
    "ADDR": <p><i class="fa fa-building mr-1"/>地址段</p>,
    "VIRTUAL_ADDR": <p><i class="fa fa-border-style mr-1"/>虚拟地址段</p>,
}

export const TagGroupDisplay = defineComponent({
    props: {
        value: {type: null as any as PropType<IsGroup>, required: true}
    },
    setup(props) {
        return () => <p>
            {props.value === "NO" ? TAG_GROUP_CONTENT["NO"] : [
                TAG_GROUP_CONTENT["YES"],
                props.value === "SEQUENCE" || props.value === "FORCE_AND_SEQUENCE" ? TAG_GROUP_CONTENT["SEQUENCE"] : null,
                props.value === "FORCE" || props.value === "FORCE_AND_SEQUENCE" ? TAG_GROUP_CONTENT["FORCE"] : null
            ]}
        </p>
    }
})

const TAG_GROUP_CONTENT: {[key in Exclude<IsGroup, "FORCE_AND_SEQUENCE">]: JSX.Element} = {
    "NO": <><i class="fa fa-object-group mr-1 has-text-grey"/><span class="mr-3 has-text-grey">非组</span></>,
    "YES": <><i class="fa fa-object-group mr-1"/><span class="mr-3">组</span></>,
    "SEQUENCE": <><i class="fa fa-sort-alpha-down mr-1"/><span class="mr-3">序列化</span></>,
    "FORCE": <><b class="mr-1">!</b><span class="mr-3">强制唯一</span></>
}

export const TagGroupMemberDisplay = defineComponent({
    props: {
        member: Boolean,
        memberIndex: Number
    },
    setup(props) {
        return () => <p>
            {props.member ? <><i class="fa fa-object-ungroup mr-1"/><span class="mr-3">组成员</span></> : null}
            {props.memberIndex ? <><i class="fa fa-sort-alpha-down mr-1"/><span class="mr-1">序列化顺位</span><b>{props.memberIndex}</b></> : null}
        </p>
    }
})

export const TagLinkDisplay = defineComponent({
    props: {
        value: {type: Array as any as PropType<TagLink[]>, required: true}
    },
    emits: {
        click: (_: number) => true
    },
    setup(props, { emit }) {
        return () => props.value.length
            ? props.value.map(link => <TagLinkElement key={link.id} value={link} onClick={() => emit("click", link.id)}/>)
            : <p class="flex">
                <span class="tag mr-1"><i class="fa fa-link"/></span>
                <span class="tag">没有链接项</span>
            </p>
    }
})

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
