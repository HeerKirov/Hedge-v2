import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <div class="middle-layout">
            <div class="layout-container"/>
            <div class="layout-container"/>
        </div>
    }
})
