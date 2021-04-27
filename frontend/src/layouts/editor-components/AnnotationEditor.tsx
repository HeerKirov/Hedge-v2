import { defineComponent, onMounted, onUnmounted, PropType, ref } from "vue"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import Input from "@/components/forms/Input"
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

        return () => <div ref={pickerRef} class={style.picker}>
            <Input class="is-small is-width-medium" placeholder="搜索并添加注解" onfocus={focus}/>
            {showBoard.value && <div class={[style.pickerBoard, "block", "has-border-more-deep-light", "is-light", "is-white"]}>
                <AnnotationPickerBoardContent/>
            </div>}
        </div>
    }
})

const AnnotationPickerBoardContent = defineComponent({
    setup() {
        const keypress = (e: KeyboardEvent) => {
            if(e.key === "ArrowUp" || e.key === "ArrowDown") {
                console.log(e.key)
                e.returnValue = false
            }
        }

        return () => <div>

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
