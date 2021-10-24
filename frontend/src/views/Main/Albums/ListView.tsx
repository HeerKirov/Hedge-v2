import { defineComponent } from "vue"
import { useAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        const { dataView, endpoint, viewController: { columnNum } } = useAlbumContext()

        return () => <div>
        </div>
    }
})
