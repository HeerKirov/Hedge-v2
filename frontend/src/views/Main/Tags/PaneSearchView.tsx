import { computed, defineComponent, PropType, ref } from "vue"
import Input from "@/components/forms/Input"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useKeyboardSelector } from "@/functions/utils/element"
import { onKeyEnter } from "@/utils/events"
import { useTagPaneContext, useSearchService, useTagTreeAccessor } from "./inject"
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
        const enterForSearch = (e: KeyboardEvent) => {
            const newValue = searchBoxText.value.trim()
            if(searchText.value !== newValue) {
                searchText.value = newValue
                e.stopPropagation()
                e.stopImmediatePropagation()
            }
        }

        return () => <Input class={style.searchInputBox} placeholder="搜索标签名称或别名" value={searchBoxText.value}
                            onUpdateValue={v => searchBoxText.value = v} onKeydown={onKeyEnter(enterForSearch)}
                            focusOnMounted={true} refreshOnInput={true}/>
    }
})

const SearchResult = defineComponent({
    setup() {
        const { openDetailPane } = useTagPaneContext()
        const { result } = useSearchService()
        const { scrollIntoView } = useTagTreeAccessor()

        const { selectedKey, setElement, clearElement } = useKeyboardSelector(computed(() => {
            return result.value.map(item => ({
                key: item.id,
                event: () => scrollIntoView(item.id)
            }))
        }))

        return () => {
            clearElement()
            return <div class={style.resultBox}>
                {result.value.map(item => <SearchResultItem ref={el => setElement(item.id, el)} key={item.id} {...item} selected={selectedKey.value === item.id}/>)}
            </div>
        }
    }
})

const SearchResultItem = defineComponent({
    props: {
        color: {type: null as any as PropType<string | null>, required: true},
        address: {type: String, required: true},
        id: {type: Number, required: true},
        selected: Boolean
    },
    setup(props, { expose }) {
        let elementRef: Element | null = null

        const { openDetailPane } = useTagPaneContext()
        const { scrollIntoView } = useTagTreeAccessor()

        const click = () => scrollIntoView(props.id)

        expose({
            "scrollIntoView"(arg?: boolean | ScrollIntoViewOptions) {
                elementRef?.scrollIntoView(arg)
            }
        })

        return () => {
            elementRef = null
            return <div ref={el => elementRef = el as Element} class={style.resultItem}>
                <a class={["tag", props.selected ? undefined : "is-light", props.color ? `is-${props.color}` : undefined]} onClick={click}>
                    {props.address}
                </a>
            </div>
        }
    }
})
