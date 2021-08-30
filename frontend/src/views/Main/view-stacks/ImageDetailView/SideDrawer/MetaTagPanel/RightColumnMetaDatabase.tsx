import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import { usePanelContext } from "./inject"

export default defineComponent({
    setup() {
        const { rightColumnData: { tabDbType }} = usePanelContext()

        return () => <>
            <div class="mx-1">
                <button class={`button is-small is-${tabDbType.value === "author" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "author"}>
                    <span class="icon"><i class="fa fa-user-tag"/></span>
                    <span>作者</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "topic" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "topic"}>
                    <span class="icon"><i class="fa fa-hashtag"/></span>
                    <span>主题</span>
                </button>
                <button class={`button is-small is-${tabDbType.value === "tag" ? "link" : "white"} mr-1 mb-1`} onClick={() => tabDbType.value = "tag"}>
                    <span class="icon"><i class="fa fa-tag"/></span>
                    <span>标签</span>
                </button>
                <Input class="is-small is-width-medium mb-1" placeholder="搜索项目"/>
            </div>
            {tabDbType.value === "author"
                ? <RightColumnMetaDatabaseAuthor/>
            : tabDbType.value === "topic"
                ? <RightColumnMetaDatabaseTopic/>
            : //tag
                <RightColumnMetaDatabaseTag/>
            }
        </>
    }
})

const RightColumnMetaDatabaseAuthor = defineComponent({
    setup() {
        return () => <div class="h-100">

        </div>
    }
})

const RightColumnMetaDatabaseTopic = defineComponent({
    setup() {
        return () => undefined
    }
})

const RightColumnMetaDatabaseTag = defineComponent({
    setup() {
        return () => undefined
    }
})
