import { defineComponent, onMounted, ref } from "vue"

export default defineComponent({
    props: {
        showDelay: Number
    },
    setup(props) {
        const visible = ref(true)

        if(props.showDelay) {
            visible.value = false
            onMounted(() => setTimeout(() => visible.value = true, props.showDelay))
        }
        return () => <progress class={{"progress": true, "is-small": true, "is-info": true, "is-width-8": true, "is-hidden": !visible.value}} max="100"/>
    }
})