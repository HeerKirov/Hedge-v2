import { defineComponent, ref } from "vue"
import Input from "@/components/forms/Input"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { onKeyEnter } from "@/utils/events"
import { useTagPaneContext, useSearchService } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { closePane } = useTagPaneContext()

        return () => <PaneBasicLayout class={style.paneSearchContent} onClose={closePane} overflow={false}>
            <SearchResultCount/>
            <SearchTextBox/>
            <SearchResult/>
        </PaneBasicLayout>
    }
})

const SearchResultCount = defineComponent({
    setup() {
        const { result } = useSearchService()
        return () => result.value.length > 0 ? <p class={style.resultCount}>
            共{result.value.length}项结果
        </p> : <p class={[style.resultCount, "has-text-grey"]}>
            无结果
        </p>
    }
})

const SearchTextBox = defineComponent({
    setup() {
        const { searchText } = useSearchService()

        const searchBoxText = ref<string>(searchText.value ?? "")
        const enterForSearch = () => searchText.value = searchBoxText.value

        return () => <Input class={style.searchInputBox} placeholder="搜索标签名称或别名" value={searchBoxText.value}
                            onUpdateValue={v => searchBoxText.value = v} onKeypress={onKeyEnter(enterForSearch)}
                            focusOnMounted={true} refreshOnInput={true}/>
    }
})

const SearchResult = defineComponent({
    setup() {
        const { result } = useSearchService()

        return () => <div class={style.resultBox}>
            {result.value.map(item => <p class={item.color ? `has-text-${item.color}` : null}>
                {item.address}
            </p>)}
        </div>
    }
})
