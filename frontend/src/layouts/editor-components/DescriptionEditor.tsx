import { defineComponent } from "vue"
import Textarea from "@/components/forms/Textarea"

export default defineComponent({
    props: {
        value: {type: String, required: true},
        showSaveButton: {type: Boolean, default: false}
    },
    emits: ["updateValue", "save"],
    setup(props, { emit }) {
        const setValue = (v: string) => emit("updateValue", v)
        const save = () => emit("save")
        return () => <div>
            <Textarea placeholder="描述" value={props.value} onUpdateValue={setValue} refreshOnInput={true} focusOnMounted={true}/>
            {props.showSaveButton && <button class="button is-small has-text-link w-100" onClick={save}><span class="icon"><i class="fa fa-save"/></span></button>}
        </div>
    }
})
