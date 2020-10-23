import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import PanelListView from "./PanelListView"
import "./style.scss"

export type TopicType = "copyright" | "work" | "character"

export interface TopicItem {
    title: string
    type: TopicType
    annotations?: string[]
    count: number
}

export default defineComponent({
    setup() {
        const items: TopicItem[] = [
            {title: "满溢的水果挞", type: "work", count: 15, annotations: ["动画", "萌豚饲料"]},
            {title: "成神之日", type: "work", count: 16, annotations: ["动画"]},
            {title: "雏 (成神之日)", type: "character", count: 13},
            {title: "柚子社", type: "copyright", count: 45, annotations: ["GalGame制作公司"]},
        ]

        return () => <div id="hedge-topics">
            <PanelListView items={items}/>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})