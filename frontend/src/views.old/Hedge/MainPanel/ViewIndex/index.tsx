import { defineComponent } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"

export default defineComponent({
    setup() {
        return () => <div id="hedge-index">
            <TopBar>
                <TopBarContent/>
            </TopBar>
        </div>
    }
})