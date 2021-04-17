import { defineComponent, reactive, watch } from "vue"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { AnnotationCreateForm } from "@/functions/adapter-http/impl/annotations"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { useMessageBox } from "@/functions/module"
import { checkTagName } from "@/utils/check"
import { onKeyEnter } from "@/utils/events"
import { objects } from "@/utils/primitives"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { AnnotationTargetEditor } from "./EditorComponents"
import { CAN_BE_EXPORTED_SELECT_ITEMS } from "./define"
import { useAnnotationContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { listEndpoint, createMode, openDetailPane, closePane } = useAnnotationContext()

        const form: AnnotationCreateForm = reactive(objects.deepCopy(createMode.value!))

        watch(createMode, template => {
            if(template != null) {
                form.name = template.name
                form.canBeExported = template.canBeExported
                form.target = [...template.target]
            }
        })

        const creator = useObjectCreator({
            form,
            create: httpClient => httpClient.annotation.create,
            beforeCreate(form): boolean | void {
                if(!checkTagName(form.name)) {
                    message.showOkMessage("错误", "不合法的名称。名称不能为空，且不能包含 ` \" ' . | 字符。")
                    return false
                }
            },
            afterCreate(result: IdResponse) {
                openDetailPane(result.id)
                listEndpoint.refresh()
            },
            handleError(e) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("错误", "该名称已存在。")
                }else{
                    return e
                }
            }
        })

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            <p class="ml-m1"><button class="button is-white is-small" onClick={creator.save}><span class="icon"><i class="fa fa-check"/></span><span>保存</span></button></p>
            <Input class="mt-4" placeholder="注解名称" value={form.name} onUpdateValue={v => form.name = v} onKeypress={onKeyEnter(creator.save)} focusOnMounted={true} refreshOnInput={true}/>
            <Select class="mt-6" items={CAN_BE_EXPORTED_SELECT_ITEMS} value={form.canBeExported.toString()} onUpdateValue={v => form.canBeExported = v === "true"}/>
            <p class="mt-4">适用类型</p>
            <AnnotationTargetEditor value={form.target} onUpdateValue={v => form.target = v}/>
        </PaneBasicLayout>
    }
})
