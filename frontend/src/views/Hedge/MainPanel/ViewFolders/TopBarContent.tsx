import { defineComponent, PropType, ref, watch } from "vue"
import TopBarQueryBox from "../../TopBar/QueryBox"

export type ViewType = "list" | "item"

export default defineComponent({
    props: {
        viewType: null as PropType<ViewType>
    },
    emits: ["updateViewType"],
    setup(props, { emit }) {
        const viewType = ref<ViewType>(props.viewType ?? "item")
        watch(() => props.viewType, () => { viewType.value = props.viewType })
        const onListView = () => {
            viewType.value = "list"
            emit("updateViewType", viewType.value)
        }
        const onItemView = () => {
            viewType.value = "item"
            emit("updateViewType", viewType.value)
        }

        return () => <nav class="level">
            <div class="level-item">
                <div class="field w-100 mx-6 pl-6 pr-3">
                    <TopBarQueryBox/>
                </div>
            </div>
            <div class="level-right">
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
            </div>
        </nav>
    }
})