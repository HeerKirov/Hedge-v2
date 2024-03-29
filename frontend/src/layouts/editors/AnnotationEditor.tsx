import { defineComponent, PropType } from "vue"
import { AnnotationElement } from "@/layouts/elements"
import { HistoryPushFunction, HistoryRequestFunction, SearchBoxPicker, SearchRequestFunction, SearchResultAttachItem } from "@/components/data/SearchPicker"
import { Annotation, AnnotationTarget, SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { HttpClient } from "@/functions/adapter-http"
import { ToastManager } from "@/services/module/toast"
import { useMessageBox } from "@/services/module/message-box"

export default defineComponent({
    props: {
        value: {type: Array as PropType<SimpleAnnotation[]>, required: true},
        target: String as PropType<AnnotationTarget>
    },
    emits: {
        updateValue(_: SimpleAnnotation[]) { return true }
    },
    setup(props, { emit }) {
        const message = useMessageBox()

        const pick = (newAnnotation: SimpleAnnotation) => {
            if(props.value.find(a => a.id === newAnnotation.id) == undefined) {
                emit("updateValue", [...props.value, newAnnotation])
            }
        }

        const onRemoveItem = (index: number) => () => emit("updateValue", [...props.value.slice(0, index), ...props.value.slice(index + 1)])

        const request: SearchRequestFunction = (httpClient, offset, limit, search) =>
            httpClient.annotation.list({offset, limit, query: search, order: "-createTime", target: props.target})
        const historyRequest: HistoryRequestFunction = httpClient => httpClient.pickerUtil.history.annotations()
        const historyPush: HistoryPushFunction = (httpClient, item: Annotation) => httpClient.pickerUtil.history.push({type: "ANNOTATION", id: item.id})

        const create = async (name: string, httpClient: HttpClient, handleException: ToastManager["handleException"]): Promise<SimpleAnnotation | null> => {
            const existRes = await httpClient.annotation.list({name, limit: 1})
            if(!existRes.ok) {
                if(existRes.exception) handleException(existRes.exception)
                return null
            }

            if(existRes.data.total) {
                //找到已存在的记录
                if(await message.showYesNoMessage("confirm", `注解"${name}"是已存在的。`, "是否选择将其直接添加到注解列表？")) {
                    const annotation = existRes.data.result[0]
                    return {id: annotation.id, name: annotation.name}
                }
            }else{
                //没有已存在的记录
                if(await message.showYesNoMessage("confirm", `确定创建新的注解"${name}"?`)) {
                    const idRes = await httpClient.annotation.create({name, canBeExported: false, target: []})
                    if(!idRes.ok) {
                        if(idRes.exception) handleException(idRes.exception)
                        return null
                    }
                    const { id } = idRes.data
                    return {id, name}
                }
            }
            return null
        }

        const attachItems: SearchResultAttachItem[] = [
            {
                key: "create",
                title: search => `新建注解"${search}"`,
                icon: "plus",
                click({ search, pick, httpClient, handleException }) {
                    create(search, httpClient, handleException).then(newAnnotation => {
                        if(newAnnotation) pick(newAnnotation)
                    })
                }
            }
        ]

        const slots = {
            default: (a: SimpleAnnotation) => <AnnotationElement value={a}/>
        }

        return () => <div>
            {props.value.map((annotation, i) => <AnnotationElement value={annotation} class="mr-1 mb-1" v-slots={{
                backOfTag: () => <a class="tag-button" onClick={onRemoveItem(i)}><i class="fa fa-times"/></a>
            }}/>)}
            <SearchBoxPicker placeholder="搜索注解" request={request} historyRequest={historyRequest} historyPush={historyPush} searchResultAttachItems={attachItems} onPick={pick} v-slots={slots}/>
        </div>
    }
})
