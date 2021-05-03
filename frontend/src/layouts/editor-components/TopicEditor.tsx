import { ComponentInternalInstance, computed, defineComponent, PropType, reactive, readonly, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import { ParentTopic } from "@/functions/adapter-http/impl/topic"
import { useHttpClient } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { KeyboardSelectorItem, useKeyboardSelector, watchElementExcludeClick } from "@/functions/utils/element"
import { installation } from "@/functions/utils/basic"
import { onKeyEnter } from "@/utils/events"
import { sleep } from "@/utils/primitives"
import style from "./TopicEditor.module.scss"

export default defineComponent({
    props: {
        value: {type: null as any as PropType<ParentTopic | null>, required: true}
    },
    emits: {
        updateValue(_: ParentTopic | null) { return true }
    },
    setup(props, { emit }) {
        const { pickerRef, showBoard, switchShow } = useBoard()

        const pick = (v: ParentTopic) => {
            if(props.value?.id !== v.id) {
                emit("updateValue", v)
            }
        }

        const remove = () => {
            if(props.value != null) {
                emit("updateValue", null)
            }
        }

        return () => <span ref={pickerRef} class={style.editor}>
            <span class="mr-1" onClick={switchShow}>
                <span class="tag">{props.value?.name ?? "未选择"}</span>
            </span>
            <button class="square button is-white is-small" onClick={remove}>
                <span class="icon"><i class="fa fa-times"/></span>
            </button>

            {showBoard.value && <TopicPickerBoard onPick={pick}/>}
        </span>
    }
})

const TopicPickerBoard = defineComponent({
    emits: {
        pick(_: ParentTopic) { return true }
    },
    setup(_, { emit }) {
        const { updateSearch, contentType } = installData(v => pick(v))

        const textBox = ref("")

        const enter = () => updateSearch(textBox.value.trim())

        const pick = (v: ParentTopic) => {
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

        return () => <div class={[style.pickerBoard, "block", "is-overflow-hidden", "has-border-more-deep-light", "is-light", "is-white"]}>
            <div class={style.inputDiv}>
                <Input class="is-small is-fullwidth" placeholder="搜索并添加主题"
                       value={textBox.value} onUpdateValue={v => textBox.value = v}
                       onKeypress={onKeyEnter(enter)}
                       refreshOnInput={true} focusOnMounted={true}/>
            </div>
            {contentType.value === "recent"
                ? <RecentContent onPick={pick}/>
                : <SearchResultContent onPick={pick}/>}
        </div>
    }
})

const RecentContent = defineComponent({
    setup() {
        return () => <div class={style.recentContent}>
            <div class={style.scrollContent}>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </div>
        </div>
    }
})

const SearchResultContent = defineComponent({
    emits: ["pick"],
    setup(_, { emit }) {
        const onPick = (topic: ParentTopic) => () => emit("pick", topic)

        const { searchData } = useData()
        const { elements, selectedKey } = useKeyboardSelector(computed(() => {
            const elements: KeyboardSelectorItem[] = searchData.data.result.map(item => ({
                key: item.id,
                event: onPick(item)
            }))
            if(searchData.showMore) elements.push({
                key: "more",
                event: searchData.next
            })
            return elements
        }))


        return () => {
            const setRef = (i: number | string) => (el: Element | ComponentInternalInstance | null) => {
                if(el) elements.value[i] = el as Element
            }

            elements.value = {}

            return <div class={style.searchBoardContent}>
                <div class={style.scrollContent}>
                    <p class="has-text-grey is-size-small ml-1 mb-1"><i>搜索结果</i></p>
                    {!searchData.loading && !searchData.data.total ?
                        <div class="has-text-grey m-2 has-text-centered">无匹配结果</div> : null}
                    {searchData.data.result.map(topic => (
                        <div key={topic.id} ref={setRef(topic.id)}
                             class={{[style.item]: true, [style.selected]: topic.id === selectedKey.value}}
                             onClick={onPick(topic)}>
                            <span class="tag">{topic.name}</span>
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

function useBoard() {
    const pickerRef = ref<HTMLElement>()
    const showBoard = ref(false)

    watchElementExcludeClick(pickerRef, () => {
        if(showBoard.value) {
            showBoard.value = false
        }
    })

    const switchShow = () => {
        showBoard.value = !showBoard.value
    }

    return {pickerRef, showBoard, switchShow}
}

const [installData, useData] = installation(function(pick: (a: ParentTopic) => void) {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const search = ref("")
    const updateSearch = (text: string) => {
        if(search.value !== text) {
            search.value = text
        }
    }

    const endpoint = useContinuousEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.topic.list({offset, limit, search: search.value, order: "-updateTime"})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError,
        initSize: 4,
        continueSize: 2
    })

    const showMore = computed(() => !endpoint.loading.value && endpoint.data.value.total > endpoint.data.value.result.length)

    const searchData = reactive({...endpoint, showMore})

    const contentType = ref<"recent" | "search">("recent")

    watch(search, value => {
        if(value.length) {
            //有搜索内容时执行搜索
            contentType.value = "search"
            endpoint.refresh()
        }else{
            //无搜索内容时切换至recent
            contentType.value = "recent"
            endpoint.clear()
        }
    })

    return {updateSearch, contentType, searchData, search: readonly(search)}
})
