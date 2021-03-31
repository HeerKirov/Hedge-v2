import { computed, defineComponent, inject, PropType } from "vue"
import { PaneBasicLayout } from "@/layouts/SplitPane"
import { AnnotationTarget } from "@/functions/adapter-http/impl/annotations"
import { annotationContextInjection } from "@/views/Main/Annotations/inject"
import { TARGET_TYPE_ICON } from "./define"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        annotationId: {type: Number, required: true}
    },
    setup(props) {
        const { detail } = inject(annotationContextInjection)!

        const close = () => { detail.value = null }

        return () => <PaneBasicLayout onClose={close} class={style.paneDetailContent}>
            <p class="is-size-4 mt-4 mb-4">[<span class="mx-1">活跃</span>]</p>
            <p class="mt-2">
                <span><i class="fa fa-share-square mr-1"/>可导出至图库项目</span>
            </p>
            <p class="mt-4">适用类型</p>
            <AnnotationTargetView value={["TAG", "AUTHOR", "WORK"]}/>
        </PaneBasicLayout>
    }
})

const AnnotationTargetView = defineComponent({
    props: {
        value: {type: null as any as PropType<AnnotationTarget[]>, required: true}
    },
    setup(props) {
        const definitions: {type: AnnotationTarget, title: string, sub?: {type: AnnotationTarget, title: string}[]}[] = [
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

        const structs = computed(() => definitions
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
                    {!item.fullInclude && <span>不完全适用</span>}
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