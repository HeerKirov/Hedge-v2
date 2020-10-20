import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="hedge-topics">
            <TopBar>
                {() => <TopBarContent/>}
            </TopBar>
        </div>
    }
})