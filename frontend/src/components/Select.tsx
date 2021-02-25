import { defineComponent, onMounted, PropType, ref, watch } from "vue"

export default defineComponent({
    props: {
        items: null as any as PropType<SelectItem[]>,
        value: String
    },
    emits: ['updateValue'],
    setup(props, { emit }) {
        const selectDom = ref<HTMLSelectElement>()

        const changed = (e: Event) => {
            if(props.items != undefined && props.value != undefined) {
                const idx = (e.target as HTMLSelectElement).selectedIndex
                const value = props.items[idx]?.value
                if(value != undefined) {
                    emit("updateValue", value)
                }
            }
        }

        onMounted(watchProps)
        watch(() => [props.items, props.value], watchProps)

        function watchProps() {
            if(selectDom.value != undefined && props.items != undefined && props.value != undefined) {
                const idx = props.items.findIndex(item => item.value === props.value)
                if(idx >= 0) selectDom.value!.selectedIndex = idx
            }
        }

        return () => <div class="select">
            <select ref={selectDom} onChange={changed}>
                {props.items?.map(item => <option value={item.value}>{item.name}</option>)}
            </select>
        </div>
    }
})

interface SelectItem {
    value: string
    name: string
}