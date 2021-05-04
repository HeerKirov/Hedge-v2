import { defineComponent, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import { onKeyEnter } from "@/utils/events"

export default defineComponent({
    props: {
        value: String,
        placeholder: String
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const value = ref(props.value)

        watch(() => props.value, v => value.value = v)

        const enter = () => {
            const v = value.value?.trim()
            emit("updateValue", v ? v : undefined)
        }

        return () => <Input class="radius-circle no-drag"
                            placeholder={props.placeholder}
                            onKeypress={onKeyEnter(enter)}
                            refreshOnInput={true}
                            value={value.value}
                            onUpdateValue={v => value.value = v}/>
    }
})
