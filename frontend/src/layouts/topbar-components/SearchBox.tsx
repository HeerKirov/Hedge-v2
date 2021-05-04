import { defineComponent, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import { onKeyEnter } from "@/utils/events"

export default defineComponent({
    props: {
        value: String,
        placeholder: String
    },
    emits: ["search"],
    setup(props, { emit }) {
        const value = ref(props.value)

        watch(() => props.value, v => value.value = v)

        const enter = () => emit("search", value.value)

        return () => <Input class="radius-circle no-drag"
                            placeholder={props.placeholder}
                            onKeypress={onKeyEnter(enter)}
                            refreshOnInput={true}
                            value={value.value}
                            onUpdateValue={v => value.value = v}/>
    }
})
