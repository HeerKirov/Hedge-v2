import { computed, defineComponent, PropType } from "vue"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import { IsGroup, TagType, TagTreeNode } from "@/functions/adapter-http/impl/tag"
import { onKeyEnter } from "@/utils/events"
import { useTagContext } from "./inject"
import { OtherNameEditor } from "@/layouts/editor-components"


export const TagGroupEditor = defineComponent({
    props: {
        value: {type: String as PropType<IsGroup>, required: true},
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const data = computed(() => ({
            group: props.value !== "NO",
            sequence: props.value === "SEQUENCE" || props.value === "FORCE_AND_SEQUENCE",
            force: props.value === "FORCE" || props.value === "FORCE_AND_SEQUENCE"
        }))

        const setGroup = (v: boolean) => emit("updateValue", v ? "YES" : "NO")

        const setSequence = (v: boolean) => emit("updateValue", v ? (data.value.force ? "FORCE_AND_SEQUENCE" : "SEQUENCE") : (data.value.force ? "FORCE" : "YES"))

        const setForce = (v: boolean) => emit("updateValue", v ? (data.value.sequence ? "FORCE_AND_SEQUENCE" : "FORCE") : (data.value.sequence ? "SEQUENCE" : "YES"))

        return () => <>
            <p>
                <CheckBox value={data.value.group} onUpdateValue={setGroup}>
                    <i class="fa fa-object-group mr-1"/>
                    <span>组</span>
                </CheckBox>
            </p>
            <p>
                <CheckBox disabled={!data.value.group} value={data.value.sequence} onUpdateValue={setSequence}>
                    <i class="fa fa-sort-alpha-down mr-1"/>
                    <span>序列化</span>
                </CheckBox>
            </p>
            <p>
                <CheckBox disabled={!data.value.group} value={data.value.force} onUpdateValue={setForce}>
                    <b class="mr-1">!</b>
                    <span>强制唯一</span>
                </CheckBox>
            </p>
        </>
    }
})

export const NameAndOtherNamesEditor = defineComponent({
    props: {
        name: {type: String, required: true},
        otherNames: {type: Array as PropType<string[]>, required: true}
    },
    emits: ["setValue", "save"],
    setup(props, { emit }) {
        const setName = (v: string) => emit("setValue", [v, props.otherNames])
        const setOtherNames = (v: string[]) => emit("setValue", [props.name, v])
        const save = () => emit("save")

        return () => <>
            <Input class="mt-mf mb-1" placeholder="标签名" value={props.name}
                   onUpdateValue={setName} onKeypress={onKeyEnter(save)}
                   focusOnMounted={true} refreshOnInput={true}/>
            <OtherNameEditor value={props.otherNames} onUpdateValue={setOtherNames}/>
        </>
    }
})

export const NameAndOtherNameDisplay = defineComponent({
    props: {
        name: {type: String, required: true},
        otherNames: {type: Array as PropType<string[]>, required: true},
        color: String
    },
    setup(props) {
        return () => <>
            <b class={props.color ? `has-text-${props.color}` : null}>{props.name}</b>
            <i class="has-text-grey">{props.otherNames.join(" / ")}</i>
        </>
    }
})

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
    "NO": <><i class="fa fa-object-ungroup mr-1 has-text-grey"/><span class="mr-3 has-text-grey">非组</span></>,
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

export const LinkDisplay = defineComponent({
    props: {
        value: {type: Array as any as PropType<TagTreeNode[]>, required: true}
    },
    setup(props) {
        return () => props.value.length
            ? props.value.map(link => <LinkElement key={link.id} value={link}/>)
            : <p class="flex">
                <span class="tag mr-1">
                    <i class="fa fa-link"/>
                </span>
                <span class="tag">
                    没有链接项
                </span>
            </p>
    }
})

export const LinkElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagTreeNode>, required: true}
    },
    setup(props) {
        const { openDetailPane } = useTagContext()
        const click = () => openDetailPane(props.value.id)

        return () => {
            const isAddr = props.value.type !== "TAG"
            const isSequenced = props.value.group === "SEQUENCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isForced = props.value.group === "FORCE" || props.value.group === "FORCE_AND_SEQUENCE"
            const isGroup = props.value.group !== "NO"

            return <p class="flex">
                <span class="tag mr-1">
                    <i class="fa fa-link"/>
                </span>
                <a class={["tag", props.value.color ? `is-${props.value.color}` : null, isAddr ? "is-light" : null]} onClick={click}>
                    {isSequenced && <i class="fa fa-sort-alpha-down mr-1"/>}
                    {isForced && <b class="mr-1">!</b>}
                    {isGroup ? <>
                        <b class="mr-1">{'{'}</b>
                        {props.value.name}
                        <b class="ml-1">{'}'}</b>
                    </> : props.value.name}
                </a>
            </p>
        }
    }
})
