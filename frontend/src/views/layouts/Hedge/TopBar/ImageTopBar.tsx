import { defineComponent, reactive, Ref, ref } from "vue"
import QueryBox from "./QueryBox"

type ImageBarMode = "image" | "import" | "album"

export default defineComponent({
    setup() {
        const barMode: Ref<ImageBarMode> = ref("image")
        const queryInCollection = ref(true)
        const viewMode = reactive({
            expandMode: true,
            column: 8
        })

        const changeQueryInCollection = () => {
            queryInCollection.value = !queryInCollection.value
        }
        const changeViewExpandMode = () => {
            viewMode.expandMode = !viewMode.expandMode
        }

        return () => <div class="field is-grouped pl-1">
            {barMode.value === "import" && <p class="control">
                <button class="button no-drag is-success is-small is-rounded">
                    <i class="fa fa-lg fa-file-import mr-2"/>导入文件
                </button>
            </p>}
            {barMode.value === "image" && <p class="control">
                <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                    <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                </button>
            </p>}
            <QueryBox class="mx-6"/>
            <p class="control ml-3 mr-1">
                <button class="button no-drag is-small" onClick={changeViewExpandMode}>
                    <span class="icon"><i class={`fa fa-lg fa-${viewMode.expandMode ? "compress" : "expand"}`}/></span>
                </button>
            </p>
            <p class="control">
                <button class="button no-drag is-small">
                    <i class="fa fa-lg fa-border-all mr-2"/><b>{viewMode.column}</b>
                </button>
            </p>
        </div>
    }
})