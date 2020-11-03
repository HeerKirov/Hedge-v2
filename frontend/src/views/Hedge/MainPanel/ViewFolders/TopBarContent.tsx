import { defineComponent, PropType, ref, watch } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"
import QueryBox from "../../TopBar/QueryBox"

export type ViewType = "list" | "item"

export default defineComponent({
    props: {
        viewType: null as any as PropType<ViewType>
    },
    emits: ["updateViewType"],
    setup(props, { emit }) {
        const viewType = ref<ViewType>(props.viewType ?? "item")
        watch(() => props.viewType, () => { viewType.value = props.viewType ?? "item" })
        const onListView = () => {
            viewType.value = "list"
            emit("updateViewType", viewType.value)
        }
        const onItemView = () => {
            viewType.value = "item"
            emit("updateViewType", viewType.value)
        }

        return () => <MiddleLayout>
            {{
                default: () => <QueryBox placeholder="查找文件夹…" icon="folder"/>,
                right: () => <>
                    <p class="control mr-2">
                        <b class="is-size-7 line-height-24">64个文件夹</b>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <i class="fa fa-lg fa-folder-plus mr-1"/>新建文件夹
                        </button>
                    </p>
                    <p class="control">
                        <div class="buttons has-addons">
                            <button class={`button no-drag is-small ${viewType.value === "item" ? "is-link" : ""}`} onClick={onItemView}>
                                <i class="fa fa-lg fa-th-large"/>
                            </button>
                            <button class={`button no-drag is-small ${viewType.value === "list" ? "is-link" : ""}`} onClick={onListView}>
                                <i class="fa fa-lg fa-th-list"/>
                            </button>
                        </div>
                    </p>
                </>
            }}
        </MiddleLayout>
    }
})