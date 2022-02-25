import { ComponentPublicInstance, computed, defineComponent, PropType, ref, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { installArrowController, KeyboardSelectorItem, useArrowController } from "@/functions/utils/element"
import { KeyEvent } from "@/services/global/keyboard"
import { sleep } from "@/utils/process"
import { installData, useData, SearchRequestFunction, HistoryRequestFunction, HistoryPushFunction } from "./inject"
import style from "./style.module.scss"

/**
 * 搜索编辑器的面板区域。它会在多处复用，因此将核心的搜索和键控逻辑抽离为独立组件。
 * 这只是搜索面板内容，根据props处理其显示和搜索的内容，并通过事件上报其选择项。
 * 如果需要弹出面板等组件，则需要结合其他组件一起实现。
 */
export default defineComponent({
    props: {
        placeholder: String,
        initSize: {type: Number, default: 8},
        continueSize: {type: Number, default: 4},
        request: {type: null as any as PropType<SearchRequestFunction>, required: true},
        historyRequest: null as any as PropType<HistoryRequestFunction>,
        historyPush: null as any as PropType<HistoryPushFunction>
    },
    emits: ["pick"],
    setup(props, { emit, slots }) {
        const { updateSearch, contentType, searchData, historyData, pushHistoryData } = installData({
            initSize: props.initSize,
            continueSize: props.continueSize,
            request: props.request,
            historyRequest: props.historyRequest,
            historyPush: props.historyPush
        })

        const textBox = ref("")

        const enter = (e: KeyEvent) => {
            if(e.key === "Enter" && updateSearch(textBox.value.trim())) {
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
                return elements
            }
        }))

        const placeholder = toRef(props, "placeholder")

        return () => <div class={style.searchPicker}>
            <div class={style.inputDiv}>
                <Input class="is-small is-fullwidth" placeholder={placeholder.value}
                       value={textBox.value} onUpdateValue={v => textBox.value = v}
                       onKeypress={enter} refreshOnInput={true} focusOnMounted={true}/>
            </div>
            {contentType.value === "recent"
                ? <RecentContent onPick={pick} v-slots={slots}/>
                : <SearchResultContent onPick={pick} v-slots={slots}/>}
        </div>
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

            return historyData !== undefined ? <div>
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
            </div> : <div>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </div>
        }
    }
})

const SearchResultContent = defineComponent({
    emits: ["pick"],
    setup(_, { emit, slots }) {
        const onPick = (pickedItem: any) => () => emit("pick", pickedItem)

        const { searchData } = useData()
        const { selectedKey, setElement, clearElement } = useArrowController()

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
            </div>
        }
    }
})
