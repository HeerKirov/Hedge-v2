import { defineComponent, ref } from "vue"
import { useScrollView } from "@/components/logicals/VirtualScrollView"
import NumberInput from "@/components/forms/NumberInput"


export default defineComponent({
    setup() {
        const view = useScrollView()

        const editMode = ref(false)
        const editValue = ref(1)
        const edit = () => {
            editValue.value = view.state.itemOffset + 1
            editMode.value = true
        }
        const enter = (v: number) => {
            const offset = v - 1
            const navigateValue = offset < 0 ? 0 : view.state.itemTotal != undefined && offset >= view.state.itemTotal ? view.state.itemTotal - 1 : offset
            view.navigateTo(navigateValue)
            editValue.value = navigateValue + 1
        }
        const close = () => {
            editMode.value = false
        }

        return () => <div class="mx-2 no-drag">
            {editMode.value ?
                <NumberInput class="is-small is-width-half no-drag" min={1} value={editValue.value} focusOnMounted={true} onUpdateValue={enter} onBlur={close}/>
            : view.state.itemTotal ?
                <span class="tag no-drag" onClick={edit}>{view.state.itemOffset + 1}-{view.state.itemOffset + view.state.itemLimit}</span>
            :
                <span class="tag no-drag">0-0</span>
            }
            <span class="mx-1">/</span>
            <span class="tag no-drag">{view.state.itemTotal ?? 0}</span>
        </div>
    }
})
