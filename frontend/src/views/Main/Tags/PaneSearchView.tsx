import { computed, defineComponent, PropType, ref } from "vue"
import Input from "@/components/forms/Input"
import { TagAddressElement } from "@/layouts/elements"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { TagAddress } from "@/functions/api/tag-tree"
import { installArrowController, useArrowController } from "@/functions/utils/element"
import { KeyEvent } from "@/functions/feature/keyboard"
import { useTagPaneContext, useSearchService, useTagTreeAccessor } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { closePane } = useTagPaneContext()
        const { result } = useSearchService()
        const { scrollIntoView } = useTagTreeAccessor()

        installArrowController(computed(() => {
            return result.value.map(item => ({
                key: item.id,
                event: () => scrollIntoView(item.id)
            }))
        }))

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
        const arrowController = useArrowController()

        const searchBoxText = ref<string>(searchText.value ?? "")
        const enter = (e: KeyEvent) => {
            if(e.key === "Enter") {
                const newValue = searchBoxText.value.trim()
                if(searchText.value !== newValue) {
                    searchText.value = newValue
                    e.stopPropagation()
                    return
                }
            }
            arrowController.keypress(e)
        }

        return () => <Input class={style.searchInputBox} placeholder="搜索标签名称或别名" value={searchBoxText.value}
                            onUpdateValue={v => searchBoxText.value = v} onKeypress={enter}
                            focusOnMounted={true} refreshOnInput={true}/>
    }
})

const SearchResult = defineComponent({
    setup() {
        const { result } = useSearchService()

        const { selectedKey, setElement, clearElement } = useArrowController()

        return () => {
            clearElement()
            return <div class={style.resultBox}>
                {result.value.map(item => <SearchResultItem ref={el => setElement(item.id, el)} key={item.id} node={item} selected={selectedKey.value === item.id}/>)}
            </div>
        }
    }
})

const SearchResultItem = defineComponent({
    props: {
        node: {type: Object as PropType<TagAddress>, required: true},
        selected: Boolean
    },
    setup(props, { expose }) {
        let elementRef: Element | null = null

        const { scrollIntoView } = useTagTreeAccessor()

        const click = () => scrollIntoView(props.node.id)

        expose({
            "scrollIntoView"(arg?: boolean | ScrollIntoViewOptions) {
                elementRef?.scrollIntoView(arg)
            }
        })

        return () => {
            elementRef = null
            return <div ref={el => elementRef = el as Element} class={style.resultItem}>
                <TagAddressElement class={{[style.selected]: props.selected}} address={props.node} clickable={true} draggable={true} onClick={click}/>
            </div>
        }
    }
})
