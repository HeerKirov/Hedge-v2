import { defineComponent, PropType, ref } from "vue"
import Input from "@/components/forms/Input"
import { useMessageBox } from "@/services/module/message-box"
import { onKeyEnter } from "@/services/global/keyboard"
import { checkTagName } from "@/utils/check"


export default defineComponent({
    props: {
        value: {type: Array as PropType<string[]>, required: true}
    },
    emits: {
        updateValue(_: string[]) { return true }
    },
    setup(props, { emit }) {
        const newValue = (v: string) => {
            const s = v.trim()
            if(s) {
                emit("updateValue", [...props.value, s])
            }
        }

        const onDelete = (i: number) => () => {
            emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
        }

        const onUpdate = (i: number) => (v: string) => {
            emit("updateValue", [...props.value.slice(0, i), v, ...props.value.slice(i + 1)])
        }

        return () => <>
            {props.value.map((otherName, i) => <div class="flex mb-1">
                <Input class="is-fullwidth is-small mr-1" value={otherName} onUpdateValue={onUpdate(i)}/>
                <button class="square button is-white is-small" onClick={onDelete(i)}><span class="icon"><i class="fa fa-times"/></span></button>
            </div>)}
            <div class="flex">
                <OtherNameNewBox onNew={newValue}/>
                <button disabled class="is-hidden square button is-white is-small"><span class="icon"><i class="fa fa-times"/></span></button>
            </div>
        </>
    }
})

const OtherNameNewBox = defineComponent({
    emits: {
        new(_: string) { return true }
    },
    setup(_, { emit }) {
        const message = useMessageBox()

        const newText = ref("")

        const submit = () => {
            const text = newText.value.trim()
            if(text) {
                if(checkTagName(text)) {
                    emit("new", text)
                    newText.value = ""
                }else{
                    message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                }
            }
        }

        return () => <Input class="is-fullwidth is-small mr-1" placeholder="添加新的别名"
                            value={newText.value} onUpdateValue={v => newText.value = v} refreshOnInput={true}
                            onBlur={submit} onKeypress={onKeyEnter(submit)}/>
    }
})
