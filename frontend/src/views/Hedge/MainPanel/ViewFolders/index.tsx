import { defineComponent, ref } from "vue"
import TopBar from "../../TopBar"
import TopBarContent, { ViewType } from "./TopBarContent"
import PanelItemView from "./PanelItemView"
import PanelListView from "./PanelListView"
import "./style.scss"

export interface FolderItem {
    title: string
    virtual?: boolean
    count?: number
}

export default defineComponent({
    setup() {
        const viewType = ref<ViewType>("item")

        const items: FolderItem[] = [
            {title: "文件夹1", virtual: true},
            {title: "一个名字超级超级超级长的文件夹", virtual: false, count: 23},
            {title: "文件夹3", virtual: true},
            {title: "文件夹4", count: 1001},
            {title: "文件夹5", count: 12},
            {title: "文件夹1", virtual: true},
            {title: "一个名字超级超级超级长的文件夹", virtual: false, count: 23},
            {title: "文件夹3", virtual: true},
            {title: "文件夹4", count: 1001},
            {title: "文件夹5", count: 12},
        ]
        return () => <div id="hedge-folders">
            {viewType.value === "item" ? <PanelItemView items={items}/> : <PanelListView items={items}/>}
            <TopBar>
                <TopBarContent viewType={viewType.value} onUpdateViewType={(v: ViewType) => viewType.value = v}/>
            </TopBar>
        </div>
    }
})