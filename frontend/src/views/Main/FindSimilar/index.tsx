import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import TopBarContent from "./TopBarContent"
import ListView from "./ListView"
import { installFindSimilarContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installFindSimilarContext()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }}/>
    }
})
