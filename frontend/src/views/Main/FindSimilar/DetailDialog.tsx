import { defineComponent } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { ImageCompareTable } from "@/layouts/displays"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { ProcessAction } from "@/functions/adapter-http/impl/find-similar"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useToast } from "@/functions/module/toast"
import { useFindSimilarContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const toast = useToast()
        const httpClient = useHttpClient()
        const { pane: { detailMode, closePane }, list: { dataView } } = useFindSimilarContext()

        const { data } = useObjectEndpoint({
            path: detailMode,
            get: httpClient => httpClient.findSimilar.result.get
        })

        const action = useLocalStorageWithDefault<ProcessAction>("find-similar/detail/default-action", "RETAIN_NEW_AND_CLONE_PROPS")

        const submit = async () => {
            if(detailMode.value !== null) {
                const res = await httpClient.findSimilar.result.process({target: [detailMode.value], action: action.value})
                if(res.ok) {
                    const index = dataView.proxy.syncOperations.find(i => i.id === detailMode.value)
                    if(index !== undefined) {
                        dataView.proxy.syncOperations.remove(index)
                    }
                    closePane()
                }else{
                    toast.handleException(res.exception)
                }
            }
        }

        return () => <DialogBox visible={detailMode.value !== null} onClose={closePane}>
            <div class={style.detail}>
                <div class={style.infoContent}>
                    {data.value && <ImageCompareTable columnNum={data.value.images.length} ids={data.value.images.map(i => i.id)}/>}
                </div>
                <div class={style.actionContent}>
                    <div class={style.scrollContent}>
                        <p class="mb-4"><label class="label">对比并选择操作</label></p>
                        {actionList.map(i => action.value === i.key ? <p class="mb-1">
                            <a><b>
                                    <span class="icon mr-1"><i class={`fa fa-${i.icon}`}/></span><span>{i.title}</span>
                            </b></a>
                        </p> : <p class="mb-1">
                            <a class="has-text-grey" onClick={() => action.value = i.key}>
                                <span class="icon mr-1"><i class={`fa fa-${i.icon}`}/></span><span>{i.title}</span>
                            </a>
                        </p>)}
                    </div>
                    <div class={style.bottom}>
                        <button class="button is-link w-100" onClick={submit}>
                            <span class="icon"><i class="fa fa-check"/></span><span>执行选择的操作</span>
                        </button>
                    </div>
                </div>
            </div>
        </DialogBox>
    }
})

const actionList: {key: ProcessAction, title: string, icon: string}[] = [
    {key: "RETAIN_NEW_AND_CLONE_PROPS", title: "保留较新的项并复制旧项的属性", icon: "check"},
    {key: "RETAIN_NEW", title: "保留较新的项", icon: "check"},
    {key: "RETAIN_OLD_AND_CLONE_PROPS", title: "保留较旧的项并复制新项的属性", icon: "check"},
    {key: "RETAIN_OLD", title: "保留较旧的项", icon: "check"},
    {key: "DELETE", title: "清除此结果", icon: "trash"},
]
