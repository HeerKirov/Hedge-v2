import { defineComponent } from "vue"
import TopBar from "./layouts/Hedge/TopBar"
import ImageTopBar from "./layouts/Hedge/TopBar/ImageTopBar"

export default defineComponent({
    setup() {
        return () => <div class="v-hedge-index">
            <div class="title-bar absolute top w-100"></div>
            <TopBar>
                {() => <ImageTopBar/>}
            </TopBar>
        </div>
    }
})