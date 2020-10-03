import { defineComponent, ref } from "vue"

export default defineComponent({
    setup() {
        const initView = ref(true)
        return () => <div class="v-index"></div>
    }
})