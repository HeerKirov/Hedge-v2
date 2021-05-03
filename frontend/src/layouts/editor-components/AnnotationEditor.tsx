import { ComponentInternalInstance, computed, defineComponent, PropType, reactive, readonly, Ref, ref, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { AnnotationTarget, SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { useNotification } from "@/functions/document/notification"
import { useMessageBox } from "@/functions/document/message-box"
import { useHttpClient } from "@/functions/app"
import { installation } from "@/functions/utils/basic"
import { KeyboardSelectorItem, useKeyboardSelector, watchElementExcludeClick } from "@/functions/utils/element"
import { sleep } from "@/utils/primitives"
import { onKeyEnter } from "@/utils/events"
import style from "./AnnotationEditor.module.scss"

export default defineComponent({
    props: {
        value: {type: Array as PropType<SimpleAnnotation[]>, required: true},
        target: String as PropType<AnnotationTarget>
    },
    emits: {
        updateValue(_: SimpleAnnotation[]) { return true }
    },
    setup(props, { emit }) {
        const pick = (newAnnotation: SimpleAnnotation) => {
            if(props.value.find(a => a.id === newAnnotation.id) == undefined) {
                emit("updateValue", [...props.value, newAnnotation])
            }
        }

        const onRemoveItem = (index: number) => () => emit("updateValue", [...props.value.slice(0, index), ...props.value.slice(index + 1)])

        return () => <div class={style.editor}>
            {props.value.map((annotation, i) => <span class="tag mr-1 mb-1">
                <b class="mr-1">[</b>{annotation.name}<b class="ml-1">]</b>
                <a class="tag-button" onClick={onRemoveItem(i)}><i class="fa fa-times"/></a>
            </span>)}
            <AnnotationPicker onPick={pick} target={props.target}/>
        </div>
    }
})

const AnnotationPicker = defineComponent({
    props: {
        target: String as PropType<AnnotationTarget>
    },
    emits: {
        pick(_: SimpleAnnotation) { return true }
    },
    setup(props, { emit }) {
        const { updateSearch } = installData(toRef(props, "target"), v => pick(v))
        const { pickerRef, showBoard, focus } = useBoard()

        const textBox = ref("")

        const enter = () => updateSearch(textBox.value.trim())

        const pick = (v: SimpleAnnotation) => {
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

        return () => <div ref={pickerRef} class={style.picker}>
            <Input class="is-small is-width-medium" placeholder="搜索并添加注解" onfocus={focus} value={textBox.value} onUpdateValue={v => textBox.value = v} onKeypress={onKeyEnter(enter)} refreshOnInput={true}/>
            {showBoard.value && <div class={[style.pickerBoard, "block", "is-overflow-hidden", "has-border-more-deep-light", "is-light", "is-white"]}>
                <AnnotationPickerBoardContent onPick={pick}/>
            </div>}
        </div>
    }
})

const AnnotationPickerBoardContent = defineComponent({
    emits: ["pick"],
    setup(_, { emit }) {
        const { contentType } = useData()

        const pick = (v: SimpleAnnotation) => emit("pick", v)

        return () => contentType.value === "recent"
            ? <RecentContent onPick={pick}/>
            : <SearchResultContent onPick={pick}/>
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
    emits: ["pick"],
    setup(_, { emit }) {
        const onPick = (annotation: SimpleAnnotation) => () => emit("pick", annotation)

        const { searchData, create, search } = useData()
        const { elements, selectedKey } = useKeyboardSelector(computed(() => {
            const elements: KeyboardSelectorItem[] = searchData.data.result.map(item => ({
                key: item.id,
                event: onPick(item)
            }))
            if(searchData.showMore) elements.push({
                key: "more",
                event: searchData.next
            })
            elements.push({
                key: "create",
                event: create
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
                    {searchData.data.result.map(annotation => (
                        <div key={annotation.id} ref={setRef(annotation.id)}
                             class={{[style.item]: true, [style.selected]: annotation.id === selectedKey.value}}
                             onClick={onPick(annotation)}>
                            <span class="tag">
                                <b>[</b><span class="mx-1">{annotation.name}</span><b>]</b>
                            </span>
                        </div>
                    ))}
                    <div ref={setRef("more")}
                         class={{[style.moreButton]: true, [style.selected]: "more" === selectedKey.value}}
                         v-show={searchData.showMore}
                         onClick={searchData.next}>
                        加载更多…
                    </div>
                </div>
                <div ref={setRef("create")}
                     class={{[style.createButton]: true, [style.selected]: "create" === selectedKey.value}}
                     onClick={create}>
                    <i class="fa fa-plus"/>新建注解"{search.value}"
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

    const focus = () => {
        showBoard.value = true
    }

    return {pickerRef, showBoard, focus}
}

const [installData, useData] = installation(function(target: Ref<AnnotationTarget | undefined>, pick: (a: SimpleAnnotation) => void) {
    const httpClient = useHttpClient()
    const message = useMessageBox()
    const { handleError, handleException } = useNotification()

    const search = ref("")
    const updateSearch = (text: string) => {
        if(search.value !== text) {
            search.value = text
        }
    }

    const endpoint = useContinuousEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.annotation.list({offset, limit, search: search.value, target: target.value, order: "-createTime"})
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

    const create = async () => {
        const name = search.value
        const existRes = await httpClient.annotation.list({name, limit: 1})
        if(!existRes.ok) {
            if(existRes.exception) handleException(existRes.exception)
            return
        }

        if(existRes.data.total) {
            //找到已存在的记录
            if(await message.showYesNoMessage("confirm", `注解"${name}"是已存在的。`, "是否选择将其直接添加到注解列表？")) {
                const annotation = existRes.data.result[0]
                pick({id: annotation.id, name: annotation.name})
            }
        }else{
            //没有已存在的记录
            if(await message.showYesNoMessage("confirm", `确定创建新的注解"${name}"?`)) {
                const idRes = await httpClient.annotation.create({name, canBeExported: false, target: []})
                if(!idRes.ok) {
                    if(idRes.exception) handleException(idRes.exception)
                    return
                }
                const { id } = idRes.data
                pick({id, name})
            }
        }
    }

    return {updateSearch, contentType, searchData, create, search: readonly(search)}
})
