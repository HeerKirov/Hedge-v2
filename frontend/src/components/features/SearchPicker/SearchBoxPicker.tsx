import { ComponentPublicInstance, computed, defineComponent, PropType, ref, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { installArrowController, KeyboardSelectorItem, useArrowController, watchElementExcludeClick } from "@/functions/utils/element"
import { KeyEvent } from "@/functions/feature/keyboard"
import { sleep } from "@/utils/process"
import { installData, useData, SearchRequestFunction, SearchResultAttachItem, HistoryRequestFunction, HistoryPushFunction } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        placeholder: String,
        initSize: {type: Number, default: 8},
        continueSize: {type: Number, default: 4},
        request: {type: null as any as PropType<SearchRequestFunction>, required: true},
        historyRequest: null as any as PropType<HistoryRequestFunction>,
        historyPush: null as any as PropType<HistoryPushFunction>,
        searchResultAttachItems: Array as PropType<SearchResultAttachItem[]>
    },
    emits: ["pick"],
    setup(props, { emit, slots }) {
        const { contentType, updateSearch, searchData, historyData, pushHistoryData, search, httpClient, handleException } = installData({
            initSize: props.initSize,
            continueSize: props.continueSize,
            request: props.request,
            historyRequest: props.historyRequest,
            historyPush: props.historyPush
        })
        const { pickerRef, showBoard, focus } = useBoard()

        const textBox = ref("")

        const enter = (e: KeyEvent) => {
            if(updateSearch(textBox.value.trim())) {
                e.stopPropagation()
                return
            }
            arrowController.keypress(e)
        }

        const pick = (v: any) => {
            emit("pick", v)
            updateSearch("")
            textBox.value = ""
            pushHistoryData?.(v)
        }

        watch(textBox, async (value, _, onInvalidate) => {
            let invalidate = false
            onInvalidate(() => invalidate = true)
            await sleep(500)
            if(invalidate) return

            updateSearch(value.trim())
        })

        const attachItems = computed(() => props.searchResultAttachItems?.map(item => ({
            key: item.key,
            event() { item.click?.({search: search.value, pick, httpClient, handleException}) }
        })) ?? [])
        const arrowController = installArrowController(computed(() => {
            if(contentType.value === "recent" && historyData !== undefined) {
                return historyData.value.map((item, i) => ({
                    key: i,
                    event() { pick(item) }
                }))
            }else{
                const elements: KeyboardSelectorItem[] = searchData.data.result.map((item, i) => ({
                    key: i,
                    event() { pick(item) }
                }))
                if(searchData.showMore) elements.push({
                    key: "more",
                    event: searchData.next
                })
                elements.push(...attachItems.value)
                return elements
            }
        }))

        const placeholder = toRef(props, "placeholder")

        return () => <div ref={pickerRef} class={style.searchBox}>
            <Input class="is-small is-width-medium" placeholder={placeholder.value}
                   value={textBox.value} onUpdateValue={v => textBox.value = v}
                   onKeypress={enter} onfocus={focus} refreshOnInput={true}/>
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
            ? <RecentContent onPick={pick} v-slots={slots}/>
            : <SearchResultContent onPick={pick} v-slots={slots} searchResultAttachItems={props.searchResultAttachItems}/>
    }
})

const RecentContent = defineComponent({
    emits: ["pick"],
    setup(_, { emit, slots }) {
        const onPick = (pickedItem: any) => () => emit("pick", pickedItem)
        const { historyData } = useData()
        const { selectedKey, setElement, clearElement } = useArrowController()
        const setRef = (i: number | string) => (el: Element | ComponentPublicInstance | null) => setElement(i, el)

        return () => {
            clearElement()

            return historyData !== undefined ? <div class={style.recentContent}>
                <div class={style.scrollContent}>
                    <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                    {historyData.value.length > 0 ? historyData.value.map((item, i) => (
                        <div key={i} ref={setRef(i)}
                             class={{[style.item]: true, [style.selected]: i === selectedKey.value}}
                             onClick={onPick(item)}>
                            {slots.default?.(item)}
                        </div>
                    )) : <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>}
                </div>
            </div> : <div class={style.recentContent}>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </div>
        }
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

        const { selectedKey, setElement, clearElement } = useArrowController()
        const attachItems = computed(() => props.searchResultAttachItems?.map(item => ({
            ...item,
            click() { item.click?.({search: search.value, pick, httpClient, handleException}) }
        })) ?? [])

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
