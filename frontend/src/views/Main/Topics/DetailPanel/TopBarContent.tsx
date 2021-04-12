import { defineComponent } from "vue"
import { useMessageBox } from "@/functions/module"
import { useElementPopupMenu } from "@/functions/app"
import { useTopicContext } from "../inject"
import { useTopicDetailContext } from "./inject"

export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { listEndpoint, detailMode, closePane } = useTopicContext()

        const { data, setData, deleteData } = useTopicDetailContext()

        const switchFavorite = () => setData({favorite: !data.value?.favorite})

        const deleteItem = async () => {
            const id = detailMode.value!
            if(await messageBox.showYesNoMessage("确认", "确定要删除此项吗？此操作不可撤回。")) {
                if(await deleteData()) {
                    closePane()
                    const index = listEndpoint.operations.find(topic => topic.id === id)
                    if(index != undefined) listEndpoint.operations.remove(index)
                }
            }
        }

        const menu = useElementPopupMenu([
            {type: "normal", label: "新建子主题"},
            {type: "normal", label: "以此为模板新建"},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem}
        ], {position: "bottom", offsetY: 5})

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white" onClick={closePane}>
                    <span class="icon"><i class="fa fa-arrow-left"/></span>
                </button>
            </div>

            <div class="layout-container">
                {/*在这里添加favorite按钮*/}
                <button class={`square button no-drag radius-large is-white ${data.value?.favorite ? "has-text-danger" : "has-text-grey"}`} onClick={switchFavorite}>
                    <span class="icon"><i class="fa fa-heart"/></span>
                </button>
                <div class="separator"/>
                <button class="square button no-drag radius-large is-white" ref={menu.element} onClick={menu.popup}>
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
                <button class="square button no-drag radius-large is-white">
                    <span class="icon"><i class="fa fa-edit"/></span>
                </button>
            </div>
        </div>
    }
})