import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <progress class={["progress", "is-small", "is-info", "is-width-8"]} max="100"/>
    }
})