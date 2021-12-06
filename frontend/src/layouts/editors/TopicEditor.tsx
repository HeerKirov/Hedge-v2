import { defineComponent, PropType, ref } from "vue"
import { SearchPicker, SearchRequestFunction } from "@/components/features/SearchPicker"
import { ParentTopic, TopicType } from "@/functions/adapter-http/impl/topic"
import { watchElementExcludeClick } from "@/functions/utils/element"
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
                <span class={["tag", "is-light", props.value?.color ? `is-${props.value.color}` : undefined]}>
                    {props.value?.type ? <span class="icon mr-1"><i class={`fa fa-${TOPIC_TYPE_ICONS[props.value.type]}`}/></span> : null}
                    {props.value?.name ?? "未选择"}
                </span>
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
        const request: SearchRequestFunction = (httpClient, offset, limit, search) =>
            httpClient.topic.list({offset, limit, query: search, order: "-updateTime"})

        const pick = (v: ParentTopic) => emit("pick", v)

        const slots = {
            default: (topic: ParentTopic) => <span class="tag">{topic.name}</span>
        }

        return () => <div class={[style.pickerBoard, "popup-block"]}>
            <SearchPicker placeholder="搜索主题作为父主题" request={request} onPick={pick} v-slots={slots}/>
        </div>
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

export const TOPIC_TYPE_ICONS: {[key in TopicType]: string} = {
    "UNKNOWN": "question",
    "COPYRIGHT": "copyright",
    "WORK": "bookmark",
    "CHARACTER": "user-ninja"
}
