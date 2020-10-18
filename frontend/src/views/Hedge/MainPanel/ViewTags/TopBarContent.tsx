import { defineComponent, PropType, ref, watch } from "vue"
import TopBarQueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    props: {
        editorMode: Boolean
    },
    emits: ["updateEditorMode"],
    setup(props, { emit }) {
        const editorMode = ref(props.editorMode ?? false)
        watch(() => props.editorMode, v => { editorMode.value = v })
        const changeEditorMode = () => {
            editorMode.value = !editorMode.value
            emit("updateEditorMode", editorMode.value)
        }

        return () => <nav class="level">
            <div class="level-item">
                <div class="field w-100 mx-6 pl-6 pr-6">
                    <TopBarQueryBox/>
                </div>
            </div>
            <div class="level-right">
                <p class="control mr-1">
                    <button class={`button no-drag is-small ${editorMode.value ? "is-link" : ""}`} onClick={changeEditorMode}>
                        <i class="fa fa-lg fa-edit mr-1"/>编辑模式
                    </button>
                </p>
            </div>
        </nav>
    }
})