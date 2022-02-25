import { defineComponent, PropType } from "vue"
import { VirtualRow } from "@/components/logicals/VirtualScrollView"
import { FindSimilarResult, ProcessAction } from "@/functions/adapter-http/impl/find-similar"
import { useToast } from "@/services/module/toast"
import { usePopupMenu } from "@/services/module/popup-menu"
import { assetsUrl, useHttpClient } from "@/services/app"
import { useFindSimilarContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { list: { dataView }, pane } = useFindSimilarContext()

        const menu = useContextmenu()

        return () => dataView.data.value.metrics.total !== undefined && dataView.data.value.metrics.total <= 0 ? <EmptyContent/>
            : <div class="w-100 h-100">
                <VirtualRow rowHeight={60} padding={{top: 6, bottom: 0, left: 12, right: 12}} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                    {dataView.data.value.result.map(item => <Item key={item.id} value={item} onClick={() => pane.openDetailPane(item.id)} onRightClick={() => menu.popup(item)}/>)}
                </VirtualRow>
            </div>
    }
})

const EmptyContent = defineComponent({
    setup() {
        return () => <div class="w-100 h-100 has-text-centered relative">
            <p class="has-text-grey"><i>没有任何暂存导入项目</i></p>
        </div>
    }
})

const Item = defineComponent({
    props: {
        value: {type: Object as PropType<FindSimilarResult>, required: true}
    },
    emits: {
        click: () => true,
        rightClick: () => true
    },
    setup(props, { emit }) {
        const click = () => emit("click")
        const rightClick = () => emit("rightClick")

        return () => <div class={[style.item, "box"]} onContextmenu={rightClick} onClick={click}>
            <div class={style.left}>
                {props.value.images.map(image => <img class={style.img} src={assetsUrl(image.thumbnailFile)} alt={`example ${image.id}`}/>)}
            </div>
            <div class={style.right}>
                {props.value.type === "DUPLICATED" ? "相同" : "其他"}
            </div>
        </div>
    }
})

function useContextmenu() {
    const httpClient = useHttpClient()
    const toast = useToast()
    const { list: { dataView }, pane } = useFindSimilarContext()

    const menu = usePopupMenu<FindSimilarResult>(() => [
        { type: "normal", label: "显示详情", click: i => pane.openDetailPane(i.id) },
        { type: "separator" },
        { type: "normal", label: "保留较新的项并复制旧项的属性", click: i => process(i.id, "RETAIN_NEW_AND_CLONE_PROPS") },
        { type: "normal", label: "保留较新的项", click: i => process(i.id, "RETAIN_NEW") },
        { type: "separator" },
        { type: "normal", label: "保留较旧的项并复制新项的属性", click: i => process(i.id, "RETAIN_OLD_AND_CLONE_PROPS") },
        { type: "normal", label: "保留较旧的项", click: i => process(i.id, "RETAIN_OLD") },
        { type: "separator" },
        { type: "normal", label: "清除此结果", click: i => process(i.id, "DELETE") }
    ])

    const process = async (id: number, action: ProcessAction) => {
        const res = await httpClient.findSimilar.result.process({target: [id], action})
        if(!res.ok) {
            toast.handleException(res.exception)
        }else{
            const index = dataView.proxy.syncOperations.find(i => i.id === id)
            if(index !== undefined) {
                dataView.proxy.syncOperations.remove(index)
            }
        }
    }

    return menu
}
