import { defineComponent } from "vue"
import { Annotation } from "@/functions/adapter-http/impl/annotations"
import { TopBar, MainContent } from "@/layouts/SideLayout"
import TopBarContent from "./TopBarContent"
import PanelListView from "./PanelListView"
import style from "./style.module.scss"


export default defineComponent({
    setup() {
        const items: Annotation[] = [
            {id: 1, name: "updating", canBeExported: false, target: ["AUTHOR", "TOPIC"]},
            {id: 2, name: "动画", canBeExported: true, target: ["TOPIC"]},
            {id: 3, name: "新番", canBeExported: true, target: ["TOPIC"]},
            {id: 4, name: "高频更新", canBeExported: false, target: []}
        ]

        return () => <div>
            <MainContent>
                <PanelListView items={items}/>
            </MainContent>
            <TopBar>
                <TopBarContent/>
            </TopBar>
        </div>
    }
})