import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import AlbumItem from "./Item"
import "./style.scss"

import img1 from "../../../../assets/img1.local.jpg"
import img2 from "../../../../assets/img2.local.jpg"

export default defineComponent({
    setup() {
        const items = [
            {title: "这是一串很长很长很长很长很长很长很长很长很长很长的标题～", src: img1},
            {title: "这是一串不长的标题。", src: img2},
            {title: "标题X", src: img2},
            {title: "标题Y", src: img2},
            {title: "标题X", src: img1},
            {title: "标题Y", src: img1},
            {title: "标题X", src: img2},
            {title: "标题Y", src: img2},
            {title: "标题X", src: img1},
            {title: "标题Y", src: img1},
            {title: "标题X", src: img2},
            {title: "标题Y", src: img2},
            {title: "标题X", src: img1},
            {title: "标题Y", src: img1},
        ]
        return () => <div id="hedge-albums">
            <div class="v-content">
                {items.map(item => <AlbumItem src={item.src} title={item.title}/>)}
            </div>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})