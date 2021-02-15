import { defineComponent, reactive, ref, watch } from "vue"

export default defineComponent({
    props: {
        expandMode: Boolean,
        column: Number
    },
    emits: ["updateExpandMode", "updateColumn"],
    setup(props, { emit }) {
        const expandMode = ref(props.expandMode ?? true)
        const column = ref(props.column ?? 8)

        watch(() => props.expandMode, () => { expandMode.value = props.expandMode })
        watch(() => props.column, () => { column.value = props.column ?? 8 })

        const changeViewExpandMode = () => {
            expandMode.value = !expandMode.value
            emit("updateExpandMode", expandMode.value)
        }
        
        return () => <>
            <p class="control mr-1">
                <button class="button no-drag is-small" onClick={changeViewExpandMode}>
                    <span class="icon"><i class={`fa fa-lg fa-${expandMode.value ? "expand" : "compress"}`}/></span>
                </button>
            </p>
            <p class="control">
                <button class="button no-drag is-small">
                    <i class="fa fa-lg fa-border-all mr-2"/><b>{column.value}</b>
                </button>
            </p>
        </>
    }
})