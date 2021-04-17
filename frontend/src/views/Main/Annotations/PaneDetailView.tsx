import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { ViewAndEditor } from "@/layouts/editor-components"
import { Annotation, AnnotationTarget, AnnotationUpdateForm } from "@/functions/adapter-http/impl/annotations"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useMessageBox } from "@/functions/module"
import { useAnnotationContext } from "@/views/Main/Annotations/inject"
import { AnnotationTargetEditor, AnnotationTargetView } from "./EditorComponents"
import { onKeyEnter } from "@/utils/events"
import { checkTagName } from "@/utils/check"
import { objects } from "@/utils/primitives"
import { CAN_BE_EXPORTED_SELECT_ITEMS } from "./define"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { listEndpoint, detailMode, closePane } = useAnnotationContext()

        const { data, setData } = useObjectEndpoint<number, Annotation, AnnotationUpdateForm>({
            path: detailMode,
            get: httpClient => httpClient.annotation.get,
            update: httpClient => httpClient.annotation.update,
            afterUpdate(id, data) {
                const index = listEndpoint.operations.find(annotation => annotation.id === id)
                if(index != undefined) listEndpoint.operations.modify(index, data)
            }
        })

        const setName = async (name: string) => {
            if(!checkTagName(name)) {
                message.showOkMessage("错误", "不合法的名称。名称不能为空，且不能包含 ` \" ' . | 字符。")
                return false
            }
            return name === data.value?.name || await setData({ name }, e => {
                if (e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("错误", "该名称已存在。")
                } else {
                    return e
                }
            })
        }
        const setCanBeExported = async (canBeExported: "true" | "false") => {
            const v = canBeExported === "true"
            return v === data.value?.canBeExported || await setData({ canBeExported: v })
        }
        const setAnnotationTarget = async (target: AnnotationTarget[]) => {
            return objects.deepEquals(target, data.value?.target) || await setData({ target })
        }

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            {data.value && <>
                <ViewAndEditor class="mt-7" baseline="medium" data={data.value.name} onSetData={setName} v-slots={{
                    default: ({ value }) => <p class="is-size-4">[<span class="mx-1 can-be-selected">{value}</span>]</p>,
                    editor: ({ value, setValue, save }) => <Input class="mt-mf" placeholder="注解名称" value={value}
                                                                  onUpdateValue={setValue} onKeypress={onKeyEnter(save)}
                                                                  focusOnMounted={true} refreshOnInput={true}/>
                }}/>
                <ViewAndEditor class="mt-6" data={data.value.canBeExported.toString()} onSetData={setCanBeExported} v-slots={{
                    default: ({ value }) => value === "true"
                        ? <span><i class="fa fa-share-square mr-1"/>可导出至图库项目</span>
                        : <span class="has-text-grey"><i class="fa fa-share-square mr-1"/>不可导出至图库项目</span>,
                    editor: ({ value, setValue }) => <Select class="mt-m1" items={CAN_BE_EXPORTED_SELECT_ITEMS} value={value} onUpdateValue={setValue}/>
                }}/>
                <p class="mt-4">适用类型</p>
                <ViewAndEditor data={data.value.target} onSetData={setAnnotationTarget} v-slots={{
                    default: ({ value }) => <AnnotationTargetView value={value}/>,
                    editor: ({ value, setValue }) => <AnnotationTargetEditor value={value} onUpdateValue={setValue}/>
                }}/>
            </>}
        </PaneBasicLayout>
    }
})
