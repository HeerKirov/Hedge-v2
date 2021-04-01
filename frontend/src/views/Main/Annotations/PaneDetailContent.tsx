import { computed, defineComponent, inject, PropType, ref, toRef, watch } from "vue"
import CheckBox from "@/components/CheckBox"
import { PaneBasicLayout } from "@/layouts/SplitPane"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { useObjectEndpoint } from "@/functions/utils/object-endpoint"
import { annotationContextInjection } from "@/views/Main/Annotations/inject"
import { TARGET_TYPE_ICON } from "./define"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        annotationId: {type: Number, required: true}
    },
    setup(props) {
        const { detail } = inject(annotationContextInjection)!

        const { data } = useObjectEndpoint({
            path: toRef(props, 'annotationId'),
            get: httpClient => httpClient.annotation.get,
            update: httpClient => httpClient.annotation.update,
            delete: httpClient => httpClient.annotation.delete
        })

        const close = () => { detail.value = null }

        return () => <PaneBasicLayout onClose={close} class={style.paneDetailContent}>
            {data.value && <>
                <p class="is-size-4 mt-4 mb-4">[<span class="mx-1">{data.value.name}</span>]</p>
                <p class="mt-2">
                    {data.value.canBeExported
                        ? <span><i class="fa fa-share-square mr-1"/>可导出至图库项目</span>
                        : <span class="has-text-grey"><i class="fa fa-share-square mr-1"/>不可导出至图库项目</span>
                    }
                </p>
                <p class="mt-4">适用类型</p>
                <AnnotationTargetView value={data.value.target}/>
                <AnnotationTargetEditor value={data.value.target}/>
            </>}
        </PaneBasicLayout>
    }
})

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

const AnnotationTargetView = defineComponent({
    props: {
        value: {type: null as any as PropType<AnnotationTarget[]>, required: true}
    },
    setup(props) {
        const structs = computed(() => ANNOTATION_TARGET_DEFINITIONS
            .filter(d => props.value.includes(d.type) || d.sub?.some(sd => props.value.includes(sd.type)))
            .map(d => ({
                fullInclude: props.value.includes(d.type),
                title: d.title,
                class: `fa fa-${TARGET_TYPE_ICON[d.type]}`,
                sub: d.sub?.filter(sd => props.value.includes(sd.type)).map(sd => ({
                    title: sd.title,
                    class: `fa fa-${TARGET_TYPE_ICON[sd.type]}`
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

const AnnotationTargetEditor = defineComponent({
    props: {
        value: {type: null as any as PropType<AnnotationTarget[]>, required: true}
    },
    emits: ["update"],
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
        }
        const changeSubItem = (item: NonNullable<typeof structs.value>[number], subItem: NonNullable<NonNullable<typeof structs.value>[number]["sub"]>[number]) => () => {
            if(subItem.include) {
                subItem.include = false
                if(!item.sub!.some(si => si.include)) item.include = false
            }else{
                subItem.include = true
                item.include = true
            }
        }

        watch(() => props.value, value => {
            structs.value = ANNOTATION_TARGET_DEFINITIONS
                .map(d => ({
                    include: value.includes(d.type) || (d.sub?.some(sd => value.includes(sd.type)) ?? false),
                    title: d.title,
                    type: d.type,
                    class: `fa fa-${TARGET_TYPE_ICON[d.type]}`,
                    sub: d.sub?.map(sd => ({
                        include: value.includes(d.type) || value.includes(sd.type),
                        title: sd.title,
                        type: sd.type,
                        class: `fa fa-${TARGET_TYPE_ICON[sd.type]}`
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