import { computed, defineComponent, PropType } from "vue"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import StdColorSelector from "@/components/forms/StdColorSelector"
import WrappedText from "@/components/elements/WrappedText"
import { TagLinkElement } from "@/layouts/elements"
import { OtherNameEditor } from "@/layouts/editors"
import { IsGroup, TagLink } from "@/functions/adapter-http/impl/tag"
import { useDroppable } from "@/services/global/drag"
import { useMouseHover } from "@/functions/utils/element"
import { onKeyEnter } from "@/services/global/keyboard"
import { useTagListContext } from "./inject"
import style from "./style.module.scss"

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
        otherNames: {type: Array as PropType<string[]>, required: true},
        color: String,
        enableToSetColor: {type: Boolean, default: false}
    },
    emits: ["setValue", "save"],
    setup(props, { emit }) {
        const setName = (v: string) => emit("setValue", [v, props.otherNames, props.color])
        const setOtherNames = (v: string[]) => emit("setValue", [props.name, v, props.color])
        const setColor = (v: string) => emit("setValue", [props.name, props.otherNames, v])
        const save = () => emit("save")

        return () => <>
            <div class="flex is-stretch mt-mf mb-1">
                {props.enableToSetColor && <StdColorSelector class="is-not-grow is-not-shrink" theme="element" value={props.color} onUpdateValue={setColor}/>}
                <Input class="is-width-100" placeholder="标签名" value={props.name}
                       onUpdateValue={setName} onKeypress={onKeyEnter(save)}
                       focusOnMounted={true} refreshOnInput={true}/>
            </div>
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

export const DescriptionDisplay = defineComponent({
    props: {
        value: {type: String, required: true}
    },
    emits: {
        edit: () => true
    },
    setup(props, { emit }) {
        const edit = () => emit("edit")

        const { hover, ...hoverEvents } = useMouseHover()

        return () => <div class={[style.description, "block", "is-cursor-text"]} {...hoverEvents}>
            {props.value ? <WrappedText value={props.value}/> : <i class="has-text-grey">没有描述</i>}
            {hover.value && <a class={[style.edit, "has-text-link"]} onClick={edit}><i class="fa fa-edit"/></a>}
        </div>
    }
})

export const TagLinkEditor = defineComponent({
    props: {
        value: {type: Array as any as PropType<TagLink[]>, required: true}
    },
    emits: {
        updateValue: (_: TagLink[]) => true
    },
    setup(props, { emit }) {
        const { indexedInfo } = useTagListContext()

        const add = (id: number) => {
            const tag = indexedInfo.value[id].tag
            emit("updateValue", [...props.value, {id: tag.id, name: tag.name, type: tag.type, group: tag.group, color: tag.color}])
        }

        const onDelete = (index: number) => () => emit("updateValue", [...props.value.slice(0, index), ...props.value.slice(index + 1)])

        return () => <div>
            {props.value.map((link, index) => <TagLinkElement key={link.id} value={link} showCloseButton={true} onDelete={onDelete(index)}/>)}
            <LinkEditorDropArea onAdd={add}/>
        </div>
    }
})

const LinkEditorDropArea = defineComponent({
    emits: {
        add: (_: number) => true
    },
    setup(_, { emit }) {
        const { isDragover: __, ...dropEvents } = useDroppable("tag", tag => emit("add", tag.id))

        return () => <p class="flex" {...dropEvents}>
            <span class="tag mr-1"><i class="fa fa-plus"/></span>
            <span class="tag">拖动标签到此处以添加链接</span>
        </p>
    }
})
