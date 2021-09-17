import { defineComponent } from "vue"
import { RootNodeList } from "@/layouts/data/TagTree"
import { useTagListContext, useTagPaneContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useTagListContext()

        return () => <div class={style.listView}>
            {loading.value ? null : data.value.length > 0 ? <RootNodeList items={data.value}/> : <AddFirstNode/>}
        </div>
    }
})

const AddFirstNode = defineComponent({
    setup() {
        const { openCreatePane } = useTagPaneContext()

        const click = () => openCreatePane({})

        return () => <div class={[style.rootNode, "box"]}>
            <a class="has-text-green" onClick={click}>
                添加第一个标签
                <i class="fa fa-plus ml-2"/>
            </a>
        </div>
    }
})
