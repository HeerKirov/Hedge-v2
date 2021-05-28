import { defineComponent } from "vue"
import { useEditLock, useTagPaneContext } from "./inject"

export default defineComponent({
    setup() {
        const { openCreatePane, openSearchPane } = useTagPaneContext()

        const create = () => openCreatePane({})

        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white" onClick={openSearchPane}>
                    <span class="icon"><i class="fa fa-search"/></span>
                </button>
                <button class="square button no-drag radius-large is-white" onClick={create}>
                    <span class="icon"><i class="fa fa-plus"/></span>
                </button>
                <EditLockButton/>
            </div>
        </div>
    }
})

const EditLockButton = defineComponent({
    setup() {
        const editLock = useEditLock()
        const click = () => editLock.value = !editLock.value

        return () => <button class="square button no-drag radius-large is-white" onClick={click}>
            <span class="icon"><i class={`fa fa-${editLock.value ? "lock" : "unlock"}`}/></span>
        </button>
    }
})
