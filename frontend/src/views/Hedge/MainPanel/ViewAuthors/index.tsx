import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import PanelListView from "./PanelListView"
import "./style.scss"

export type AuthorType = "artist" | "studio" | "publication"

export interface AuthorItem {
    name: string
    type: AuthorType
    annotations?: string[]
    favorite?: boolean
    count: number
}

export default defineComponent({
    setup() {
        const items: AuthorItem[] = [
            {name: "youmai", type: "artist", count: 15, annotations: ["fav"]},
            {name: "褐色娘", type: "artist", count: 16, annotations: ["fav", "like"], favorite: true},
            {name: "STUDIO WORKS.", type: "studio", count: 13},
            {name: "LOLICON", type: "publication", count: 45, favorite: true},
        ]

        return () => <div id="hedge-authors">
            <PanelListView items={items}/>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})