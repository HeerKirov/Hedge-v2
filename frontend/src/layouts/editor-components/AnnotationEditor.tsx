import { defineComponent, onMounted, onUnmounted, PropType, Ref, ref, toRef, watch } from "vue"
import Input from "@/components/forms/Input"
import { AnnotationTarget, SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { useContinuousEndpoint } from "@/functions/utils/endpoints/continuous-endpoint"
import { useNotification } from "@/functions/document/notification"
import { useHttpClient } from "@/functions/app"
import { installation } from "@/functions/utils/basic"
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
        const pick = (newAnnotation: SimpleAnnotation) => emit("updateValue", [...props.value, newAnnotation])

        return () => <div class={style.editor}>
            {props.value.map(annotation => <span class="tag mr-1">[ {annotation.name} ]</span>)}
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
        const { pickerRef, showBoard, focus } = useBoard()
        const { updateSearch, enterSearch } = installData(toRef(props, "target"))

        const textBox = ref("")

        const enter = () => enterSearch(textBox.value.trim())

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
                <AnnotationPickerBoardContent/>
            </div>}
        </div>
    }
})

const AnnotationPickerBoardContent = defineComponent({
    setup() {
        const { contentType } = useData()

        const keypress = (e: KeyboardEvent) => {
            if(e.key === "ArrowUp" || e.key === "ArrowDown") {
                console.log(e.key)
                e.returnValue = false
            }
        }

        return () => <div>
            {contentType.value === "recent" ? <>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </> : <SearchResultContent/>}
            <div class={style.newItem}>
                <i class="fa fa-plus"/>新建注解…
            </div>
        </div>
    }
})

const SearchResultContent = defineComponent({
    setup() {
        const { searchData } = useData()

        return () => <div>
            <p class="has-text-grey is-size-small ml-1 mb-1"><i>搜索结果</i></p>
            {!searchData.loading.value && !searchData.data.value.total ? <div class="has-text-grey m-2 has-text-centered">无匹配结果</div> : null}
            {searchData.data.value.result.map(annotation => <div class={style.item}>
                <span class="tag"><b>[</b><span class="mx-1">{annotation.name}</span><b>]</b></span>
            </div>)}
            <div class={style.moreItem} v-show={!searchData.loading.value && searchData.data.value.total > searchData.data.value.result.length} onClick={searchData.next}>
                加载更多…
            </div>
        </div>
    }
})

function useBoard() {
    const pickerRef = ref<HTMLElement>()
    const showBoard = ref(false)

    onMounted(() => {
        document.addEventListener("click", clickDocument)
    })

    onUnmounted(() => {
        document.removeEventListener("click", clickDocument)
    })

    const clickDocument = (e: MouseEvent) => {
        const target = e.target
        if(showBoard.value && pickerRef.value && !(pickerRef.value === target || pickerRef.value.contains(target as Node))) {
            showBoard.value = false
        }
    }

    const focus = () => {
        showBoard.value = true
    }

    return {pickerRef, showBoard, focus}
}

const [installData, useData] = installation(function (target: Ref<AnnotationTarget | undefined>) {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()

    const search = ref("")
    const updateSearch = (text: string) => search.value = text
    const enterSearch = (text: string) => {
        if(search.value !== text) {
            updateSearch(text)
        }else{
            //在LOADED，且光标选定了项时，执行pick操作
        }
    }

    const searchData = useContinuousEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.annotation.list({offset, limit, search: search.value, target: target.value, order: "-createTime"})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError,
        initSize: 4,
        continueSize: 2
    })

    const contentType = ref<"recent" | "search">("recent")

    watch(search, value => {
        if(value.length) {
            //有搜索内容时执行搜索
            contentType.value = "search"
            searchData.refresh()
        }else{
            //无搜索内容时切换至recent
            contentType.value = "recent"
            searchData.clear()
        }
    })

    return {updateSearch, enterSearch, contentType, searchData}
})
