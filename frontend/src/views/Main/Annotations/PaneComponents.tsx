import { computed, defineComponent, PropType, ref, watch } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { TARGET_TYPE_ICONS } from "@/definitions/annotation"
import style from "./style.module.scss"

const ANNOTATION_TARGET_DEFINITIONS: {type: AnnotationTarget, title: string, sub?: {type: AnnotationTarget, title: string}[]}[] = [
    {type: "TAG", title: "标签"},
    {type: "AUTHOR", title: "作者", sub: [
            {type: "ARTIST", title: "画师"},
            {type: "STUDIO", title: "工作室"},
            {type: "PUBLISH", title: "出版物"}
        ]},
    {type: "TOPIC", title: "主题", sub: [
            {type: "COPYRIGHT", title: "版权方"},
            {type: "WORK", title: "作品"},
            {type: "CHARACTER", title: "角色"}
        ]}
]

export const AnnotationTargetDisplay = defineComponent({
    props: {
        value: {type: null as any as PropType<AnnotationTarget[]>, required: true}
    },
    setup(props) {
        const structs = computed(() => ANNOTATION_TARGET_DEFINITIONS.every(d => props.value.includes(d.type)) ? []
            : ANNOTATION_TARGET_DEFINITIONS
                .filter(d => props.value.includes(d.type) || d.sub?.some(sd => props.value.includes(sd.type)))
                .map(d => ({
                    fullInclude: props.value.includes(d.type),
                    title: d.title,
                    class: `fa fa-${TARGET_TYPE_ICONS[d.type]}`,
                    sub: d.sub?.filter(sd => props.value.includes(sd.type)).map(sd => ({
                        title: sd.title,
                        class: `fa fa-${TARGET_TYPE_ICONS[sd.type]}`
                    }))
                })))

        return () => <div class={style.annotationTargetView}>
            {structs.value.length === 0 ? <p>
                <span class="icon"><i class="fa fa-check"/></span>
                <span>全部</span>
            </p> : structs.value.map(item => <>
                <p>
                    {item.fullInclude
                        ? <span class="icon"><i class="fa fa-check"/></span>
                        : <span class="icon"><i class="fa fa-minus"/></span>
                    }
                    <span class="icon"><i class={item.class}/></span>
                    {!item.fullInclude && <span>(不完全适用)</span>}
                    <span>{item.title}</span>
                </p>
                {item.sub?.map(subItem => <p class={style.sub}>
                    <span class="icon"><i class="fa fa-check"/></span>
                    <span class="icon"><i class={subItem.class}/></span>
                    <span>{subItem.title}</span>
                </p>)}
            </>)}
        </div>
    }
})

export const AnnotationTargetEditor = defineComponent({
    props: {
        value: {type: null as any as PropType<AnnotationTarget[]>, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const structs = ref<{include: boolean, title: string, type: AnnotationTarget, class: string, sub?: {include: boolean, title: string, type: AnnotationTarget, class: string}[]}[]>()

        const changeItem = (item: NonNullable<typeof structs.value>[number]) => () => {
            if(item.include) {
                item.include = false
                if(item.sub) {
                    for(const subItem of item.sub) {
                        subItem.include = false
                    }
                }
            }else{
                item.include = true
                if(item.sub) {
                    for(const subItem of item.sub) {
                        subItem.include = true
                    }
                }
            }
            update()
        }
        const changeSubItem = (item: NonNullable<typeof structs.value>[number], subItem: NonNullable<NonNullable<typeof structs.value>[number]["sub"]>[number]) => () => {
            if(subItem.include) {
                subItem.include = false
                item.include = false
            }else{
                subItem.include = true
                if(item.sub!.every(si => si.include)) item.include = true
            }
            update()
        }

        const update = () => {
            const value = structs.value!.flatMap(item => item.include ? [item.type] : item.sub?.filter(subItem => subItem.include).map(subItem => subItem.type) ?? [])
            if(ANNOTATION_TARGET_DEFINITIONS.every(d => value.includes(d.type))) {
                emit("updateValue", [])
            }else{
                emit("updateValue", value)
            }
        }

        watch(() => props.value, value => {
            const targets = value.length > 0 ? value : ["TAG", "AUTHOR", "TOPIC"]
            structs.value = ANNOTATION_TARGET_DEFINITIONS
                .map(d => ({
                    include: targets.includes(d.type) || (d.sub?.every(sd => targets.includes(sd.type)) ?? false),
                    title: d.title,
                    type: d.type,
                    class: `fa fa-${TARGET_TYPE_ICONS[d.type]}`,
                    sub: d.sub?.map(sd => ({
                        include: targets.includes(d.type) || targets.includes(sd.type),
                        title: sd.title,
                        type: sd.type,
                        class: `fa fa-${TARGET_TYPE_ICONS[sd.type]}`
                    }))
                }))
        }, {immediate: true})

        return () => <div class={style.annotationTargetEditor}>
            {structs.value?.map(item => <>
                <p>
                    <CheckBox value={item.include} onUpdateValue={changeItem(item)}>
                        <span class="icon"><i class={item.class}/></span>
                        <span>{item.title}</span>
                    </CheckBox>
                </p>
                {item.sub?.map(subItem => <p class={style.sub}>
                    <CheckBox value={subItem.include} onUpdateValue={changeSubItem(item, subItem)}>
                        <span class="icon"><i class={subItem.class}/></span>
                        <span>{subItem.title}</span>
                    </CheckBox>
                </p>)}
            </>)}
        </div>
    }
})
