import { defineComponent, ref, Transition, watch } from "vue"
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
                    {editorMode.value ? 
                        <button class="button no-drag is-small is-link" onClick={changeEditorMode}>
                            <span class="icon mr-1"><i class="fa fa-check"/></span>退出编辑并应用所有更改
                        </button> 
                    :
                        <button class="button no-drag is-small" onClick={changeEditorMode}>
                            <span class="icon mr-1"><i class="fa fa-edit"/></span>标签编辑视图
                        </button>
                    }
                </p>
            </div>
        </nav>
    }
})