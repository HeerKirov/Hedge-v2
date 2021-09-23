import { defineComponent, ref, watch } from "vue"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { Annotation, AnnotationCreateForm } from "@/functions/adapter-http/impl/annotations"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { useMessageBox } from "@/functions/module/message-box"
import { checkTagName } from "@/utils/check"
import { onKeyEnter } from "@/utils/events"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { AnnotationTargetEditor } from "./PaneComponents"
import { CAN_BE_EXPORTED_SELECT_ITEMS } from "@/definitions/annotation"
import { useAnnotationContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { endpoint, createMode, openDetailPane, closePane } = useAnnotationContext()

        const form = ref(mapCreatorData(createMode.value!))

        watch(createMode, template => {
            if(template != null) {
                form.value = mapCreatorData(template)
            }
        })

        const creator = useObjectCreator({
            form,
            create: httpClient => httpClient.annotation.create,
            beforeCreate(form): boolean | void {
                if(!checkTagName(form.name)) {
                    message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                    return false
                }
            },
            afterCreate(result: IdResponse) {
                openDetailPane(result.id)
                endpoint.refresh()
            },
            handleError(e) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                }else{
                    return e
                }
            }
        })

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            <p class="ml-m1"><button class="button is-white is-small" onClick={creator.save}><span class="icon"><i class="fa fa-check"/></span><span>保存</span></button></p>
            <Input class="mt-4" placeholder="注解名称" value={form.value.name} onUpdateValue={v => form.value.name = v} onKeypress={onKeyEnter(creator.save)} focusOnMounted={true} refreshOnInput={true}/>
            <Select class="mt-6" items={CAN_BE_EXPORTED_SELECT_ITEMS} value={form.value.canBeExported.toString()} onUpdateValue={v => form.value.canBeExported = v === "true"}/>
            <p class="mt-4">适用类型</p>
            <AnnotationTargetEditor value={form.value.target} onUpdateValue={v => form.value.target = v}/>
        </PaneBasicLayout>
    }
})

function mapCreatorData(mode: Partial<Annotation>): AnnotationCreateForm {
    return {
        name: mode.name ?? "",
        canBeExported: mode.canBeExported ?? false,
        target: mode.target ?? []
    }
}
