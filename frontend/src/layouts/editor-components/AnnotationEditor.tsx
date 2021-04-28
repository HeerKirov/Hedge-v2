import { defineComponent, onMounted, onUnmounted, PropType, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { installation } from "@/functions/utils/basic"
import { sleep } from "@/utils/primitives"
import { onKeyEnter } from "@/utils/events"
import style from "./AnnotationEditor.module.scss"


export default defineComponent({
    props: {
        value: {type: Array as PropType<SimpleAnnotation[]>, required: true}
    },
    emits: {
        updateValue(_: SimpleAnnotation[]) { return true }
    },
    setup(props, { emit }) {
        const pick = (newAnnotation: SimpleAnnotation) => emit("updateValue", [...props.value, newAnnotation])

        return () => <div class={style.editor}>
            {props.value.map(annotation => <span class="tag mr-1">[ {annotation.name} ]</span>)}
            <AnnotationPicker onPick={pick}/>
        </div>
    }
})

const AnnotationPicker = defineComponent({
    props: {

    },
    emits: {
        pick(_: SimpleAnnotation) { return true }
    },
    setup(props, { emit }) {
        const { pickerRef, showBoard, focus } = useBoard()
        const { updateSearch, enterSearch } = installData()

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
        const { content } = useData()

        const keypress = (e: KeyboardEvent) => {
            if(e.key === "ArrowUp" || e.key === "ArrowDown") {
                console.log(e.key)
                e.returnValue = false
            }
        }

        return () => <div>
            {content.value.type === "recent" ? <>
                <p class="has-text-grey is-size-small ml-1"><i>最近使用</i></p>
                <div class="has-text-grey m-2 has-text-centered">无最近使用项</div>
            </> : <>
                <p class="has-text-grey is-size-small ml-1"><i>搜索结果</i></p>
                <div class="has-text-grey m-2 has-text-centered">无匹配结果</div>
            </>}
            <div class={style.selectItem}>
                <i class="fa fa-plus"/>新建注解...
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

const [installData, useData] = installation(function () {
    const search = ref("")
    const updateSearch = (text: string) => search.value = text
    const enterSearch = (text: string) => {
        if(search.value !== text) {
            updateSearch(text)
        }else{
            //在LOADED，且光标选定了项时，执行pick操作
        }
    }

    type Content = RecentlyContent | SearchResultContent
    interface RecentlyContent {
        type: "recent"
    }
    interface SearchResultContent {
        type: "search"
    }

    const content = ref<Content>({type: "recent"})

    watch(search, value => {
        if(value.length) {
            //有搜索内容时执行搜索
            content.value = {type: "search"}
        }else{
            //无搜索内容时切换至recent
            content.value = {type: "recent"}
        }
    })

    return {updateSearch, enterSearch, content}
})
