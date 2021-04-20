import { defineComponent, PropType } from "vue"
import Starlight from "@/components/elements/Starlight"

export default defineComponent({
    props: {
        value: {type: null as any as PropType<number | null>, required: true}
    },
    emits: {
        updateValue(_: number | null) { return true }
    },
    setup(props, { emit }) {
        const minus = () => {
            if(props.value && props.value > 1) {
                emit("updateValue", props.value - 1)
            }else if(props.value == null) {
                emit("updateValue", 5)
            }
        }

        const plus = () => {
            if(props.value && props.value < 10) {
                emit("updateValue", props.value + 1)
            }else if(props.value == null) {
                emit("updateValue", 6)
            }
        }

        const clear = () => emit("updateValue", null)

        return () => <div class="flex">
            <div class="is-line-height-small" style="width: 8rem">
                {props.value != null
                    ? <Starlight value={props.value} showText={true}/>
                    : <div class="has-text-grey"><i>评分空缺</i></div>}
            </div>
            <button class="square button is-small is-white" onClick={minus}><span class="icon"><i class="fa fa-minus"/></span></button>
            <button class="square button is-small is-white" onClick={plus}><span class="icon"><i class="fa fa-plus"/></span></button>
            <button class="square button is-small is-white" onClick={clear}><span class="icon"><i class="fa fa-times"/></span></button>
        </div>
    }
})
