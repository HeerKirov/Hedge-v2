import { defineComponent, ref, Transition, watch } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"
import QueryBox from "../../TopBar/QueryBox"

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

        return () => <MiddleLayout>
            {{
                default: () => <QueryBox placeholder="查找标签…" icon="tags"/>,
                right: () => <Transition name="v-edit-button-transition">
                    {() => editorMode.value ? 
                        <button key="submit" class="v-edit-button button no-drag is-rounded is-small is-link" onClick={changeEditorMode}>
                            <span class="icon mr-1"><i class="fa fa-check"/></span>退出编辑并应用所有更改
                        </button> 
                    :
                        <button key="edit" class="v-edit-button button no-drag is-small" onClick={changeEditorMode}>
                            <span class="icon mr-1"><i class="fa fa-edit"/></span>编辑视图
                        </button>
                    }
                </Transition>
            }}
        </MiddleLayout>
    }
})