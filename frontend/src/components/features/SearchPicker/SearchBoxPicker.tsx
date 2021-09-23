import { ComponentPublicInstance, computed, defineComponent, PropType, ref, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { KeyboardSelectorItem, useKeyboardSelector, watchElementExcludeClick } from "@/functions/utils/element"
import { onKeyEnter } from "@/utils/events"
import { sleep } from "@/utils/process"
import { installData, useData, SearchRequestFunction, SearchResultAttachItem } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        placeholder: String,
        initSize: {type: Number, default: 8},
        continueSize: {type: Number, default: 4},
        request: {type: null as any as PropType<SearchRequestFunction>, required: true},
        searchResultAttachItems: Array as PropType<SearchResultAttachItem[]>
    },
    emits: ["pick"],
    setup(props, { emit, slots }) {
        const { updateSearch } = installData({initSize: props.initSize, continueSize: props.continueSize, request: props.request})
        const { pickerRef, showBoard, focus } = useBoard()

        const textBox = ref("")

        const enter = (e: KeyboardEvent) => {
            if(updateSearch(textBox.value.trim())) {
                e.stopPropagation()
                e.stopImmediatePropagation()
            }
        }

        const pick = (v: any) => {
            emit("pick", v)
            updateSearch("")
            textBox.value = ""
        }

        watch(textBox, async (value, _, onInvalidate) => {
            let invalidate = false
            onInvalidate(() => invalidate = true)
            await sleep(500)
            if(invalidate) return

            updateSearch(value.trim())
        })

        const placeholder = toRef(props, "placeholder")

        return () => <div ref={pickerRef} class={style.searchBox}>
            <Input class="is-small is-width-medium" placeholder={placeholder.value}
                   value={textBox.value} onUpdateValue={v => textBox.value = v}
                   onKeypress={onKeyEnter(enter)} onfocus={focus}
                   refreshOnInput={true}/>
            {showBoard.value && <div class={[style.searchBoxBoard, "popup-block"]}>
                <PickerBoardContent onPick={pick} v-slots={slots} searchResultAttachItems={props.searchResultAttachItems}/>
            </div>}
        </div>
    }
})

const PickerBoardContent = defineComponent({
    props: {
        searchResultAttachItems: Array as PropType<SearchResultAttachItem[]>
    },
    emits: ["pick"],
    setup(props, { emit, slots }) {
        const { contentType } = useData()

        const pick = (v: SimpleAnnotation) => emit("pick", v)

        return () => contentType.value === "recent"
            ? <RecentContent onPick={pick}/>
            : <SearchResultContent onPick={pick} v-slots={slots} searchResultAttachItems={props.searchResultAttachItems}/>
    }
})

const RecentContent = defineComponent({
    emits: ["pick"],
    setup(_, { }) {
        return () => <div class={style.recentContent}>
            <div class={style.scrollContent}>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </div>
        </div>
    }
})

const SearchResultContent = defineComponent({
    props: {
        searchResultAttachItems: Array as PropType<SearchResultAttachItem[]>
    },
    emits: ["pick"],
    setup(props, { emit, slots }) {
        const pick = (pickedItem: any) => emit("pick", pickedItem)
        const onPick = (pickedItem: any) => () => emit("pick", pickedItem)

        const { searchData, search, httpClient, handleException } = useData()

        const attachItems = computed(() => props.searchResultAttachItems?.map(item => ({
            ...item,
            click() { item.click?.({search: search.value, pick, httpClient, handleException}) }
        })) ?? [])

        const { selectedKey, setElement, clearElement } = useKeyboardSelector(computed(() => {
            const elements: KeyboardSelectorItem[] = searchData.data.result.map((item, i) => ({
                key: i,
                event: onPick(item)
            }))
            if(searchData.showMore) elements.push({
                key: "more",
                event: searchData.next
            })
            elements.push(...attachItems.value.map(item => ({
                key: item.key,
                event: item.click
            })))
            return elements
        }))

        const setRef = (i: number | string) => (el: Element | ComponentPublicInstance | null) => setElement(i, el)
        return () => {
            clearElement()

            return <div class={style.searchBoardContent}>
                <div class={style.scrollContent}>
                    <p class="has-text-grey is-size-small ml-1 mb-1"><i>搜索结果</i></p>
                    {!searchData.loading && !searchData.data.total ?
                        <div class="has-text-grey m-2 has-text-centered">无匹配结果</div> : null}
                    {searchData.data.result.map((item, i) => (
                        <div key={i} ref={setRef(i)}
                             class={{[style.item]: true, [style.selected]: i === selectedKey.value}}
                             onClick={onPick(item)}>
                            {slots.default?.(item)}
                        </div>
                    ))}
                    <div ref={setRef("more")}
                         class={{[style.moreButton]: true, [style.selected]: "more" === selectedKey.value}}
                         v-show={searchData.showMore}
                         onClick={searchData.next}>
                        加载更多…
                    </div>
                </div>
                {attachItems.value.map(item => (
                    <div ref={setRef(item.key)}
                         class={{[style.attachButton]: true, [style.selected]: item.key === selectedKey.value}}
                         onClick={item.click}>
                        {item.icon && <i class={`fa fa-${item.icon}`}/>}
                        {typeof item.title === "function" ? item.title(search.value) : item.title}
                    </div>
                ))}
            </div>
        }
    }
})

function useBoard() {
    const pickerRef = ref<HTMLElement>()
    const showBoard = ref(false)

    watchElementExcludeClick(pickerRef, () => {
        if(showBoard.value) {
            showBoard.value = false
        }
    })

    const focus = () => {
        showBoard.value = true
    }

    return {pickerRef, showBoard, focus}
}
