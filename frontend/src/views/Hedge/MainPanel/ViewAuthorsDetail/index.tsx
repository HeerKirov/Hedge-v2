import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import Panel from "./Panel"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="hedge-authors-detail">
            <Panel/>
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})