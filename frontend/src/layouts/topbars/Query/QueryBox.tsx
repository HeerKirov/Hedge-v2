import { defineComponent, ref, SetupContext, watch } from "vue"
import Input from "@/components/forms/Input"
import { interceptGlobalKey, onKeyEnter } from "@/services/global/keyboard"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        value: String,
        expanded: {type: Boolean, default: undefined},
        placeholder: String
    },
    emits: ["updateValue", "updateExpanded"],
    setup(props, { emit }) {
        const value = ref(props.value)

        watch(() => props.value, v => value.value = v)

        const enter = () => {
            const v = value.value?.trim()
            emit("updateValue", v || undefined)
        }
        const updateExpanded = (v: boolean) => emit("updateExpanded", v)
        const updateValue = (v: string) => value.value = v

        interceptGlobalKey("Meta+KeyE", () => {
            if(props.expanded !== undefined) {
                emit("updateExpanded", !props.expanded)
            }
        })

        return () => <div class={style.queryBox}>
            <Input class={{"no-drag": true, [style.input]: true, [style.nestedByExpandButton]: props.expanded != undefined}}
                   value={value.value} onUpdateValue={updateValue} placeholder={props.placeholder}
                   onKeypress={onKeyEnter(enter)} focusOnKeypress="Meta+KeyF" acceptEventKeys={"Meta+KeyE"}
                   refreshOnInput={true}/>
            {props.expanded !== undefined && <ExpandButton expanded={props.expanded} onUpdateExpanded={updateExpanded}/>}
        </div>
    }
})

function ExpandButton(props: {expanded: boolean}, { emit }: SetupContext<{ updateExpanded(v: boolean) }>) {
    return <button class={["button", "is-small", "no-drag", "is-white", "square", "radius-circle", style.expandButton]} onClick={() => emit("updateExpanded", !props.expanded)}>
        <i class={`fa fa-caret-${props.expanded ? "up" : "down"}`}/>
    </button>
}
