import { defineComponent } from "vue"
import LazyLoad from "@/components/features/LazyLoad"
import ListPanel from "./ListPanel"
import { installFolderContext } from "./inject"

export default defineComponent({
    setup() {
        installFolderContext()

        return () => <>
            <LazyLoad visible={true} v-slots={{
                default: show => <ListPanel v-show={show}/>
            }}/>
        </>
    }
})
