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
            <AnnotationTargetView value={[]}/>
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

        return () => <div>
            {definitions.map(item => props.value.includes(item.type) && <div>
                <span class="icon"><i class="fa fa-check"/></span>
                <span class="icon"><i class={`fa fa-${TARGET_TYPE_ICON[item.type]}`}/></span>
                <span>{item.title}</span>
            </div>)}
        </div>
    }
})