import { defineComponent, inject, reactive } from "vue"
import { AnnotationCreateForm } from "@/functions/adapter-http/impl/annotations"
import { useMessageBox } from "@/functions/message"
import { PaneBasicLayout } from "@/layouts/SplitPane"
import Input from "@/components/Input"
import Select from "@/components/Select"
import { AnnotationTargetEditor } from "./EditorComponents"
import { CAN_BE_EXPORTED_SELECT_ITEMS } from "./define"
import { annotationContextInjection } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { dataEndpoint } = inject(annotationContextInjection)!

        const form: AnnotationCreateForm = reactive({
            name: "",
            canBeExported: false,
            target: []
        })

        const close = () => { }

        return () => <PaneBasicLayout onClose={close} class={style.paneDetailContent}>
            <p>新建注解</p>
            <Input class="mt-4" placeholder="注解名称" value={form.name} onUpdateValue={v => form.name = v} focusOnMounted={true} refreshOnInput={true}/>
            <Select class="mt-6" items={CAN_BE_EXPORTED_SELECT_ITEMS} value={form.canBeExported.toString()} onUpdateValue={v => form.canBeExported = v === "true"}/>
            <p class="mt-4">适用类型</p>
            <AnnotationTargetEditor value={form.target} onUpdateValue={v => form.target = v}/>
            <button class="mt-4 button is-white"><span class="icon"><i class="fa fa-check"/></span><span>保存</span></button>
        </PaneBasicLayout>
    }
})