import { defineComponent, reactive } from "vue"

export default defineComponent({
    setup() {
        const viewMode = reactive({
            expandMode: true,
            column: 8
        })
        const changeViewExpandMode = () => {
            viewMode.expandMode = !viewMode.expandMode
        }
        
        return () => <>
            <p class="control mr-1">
                <button class="button no-drag is-small" onClick={changeViewExpandMode}>
                    <span class="icon"><i class={`fa fa-lg fa-${viewMode.expandMode ? "compress" : "expand"}`}/></span>
                </button>
            </p>
            <p class="control">
                <button class="button no-drag is-small">
                    <i class="fa fa-lg fa-border-all mr-2"/><b>{viewMode.column}</b>
                </button>
            </p>
        </>
    }
})