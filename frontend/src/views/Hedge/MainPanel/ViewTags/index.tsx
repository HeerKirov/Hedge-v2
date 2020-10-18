import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import TagTree from "./TagTree"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="hedge-tags">
            <TagTree/>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})