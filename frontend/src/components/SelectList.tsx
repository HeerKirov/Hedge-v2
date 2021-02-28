import { defineComponent, onMounted, PropType, ref, watch } from "vue"
import style from "./SelectList.module.scss"

export default defineComponent({
    props: {
        items: null as any as PropType<SelectItem[]>,
        value: String,
        allowCancel: {type: Boolean, default: true}
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const value = ref(props.value)

        const onClick = (selected: string) => () => {
            emit("updateValue", value.value = selected)
        }
        const clear = (e: Event) => {
            if(props.allowCancel && (e.target as HTMLElement).id === "select-list") {
                emit("updateValue", value.value = undefined)
            }
        }
        watch(() => props.value, v => value.value = v)

        return () => <div id="select-list" class={style.selectList} onClick={clear}>
            {props.items?.map(item => <div onClick={onClick(item.value)} class={{[style.selectItem]: true, [style.selected]: item.value === value.value}}>{item.name}</div>)}
        </div>
    }
})

interface SelectItem {
    value: string
    name: string
}