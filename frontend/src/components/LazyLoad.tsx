import { defineComponent, watch } from "vue"

export default defineComponent({
    props: {
        visible: {type: Boolean, default: true}
    },
    setup(props, { slots }) {
        let loaded = props.visible

        const stop = watch(() => props.visible, visible => {
            if(visible && !loaded) {
                loaded = true
                stop()
            }
        })

        return () => props.visible ? slots.default?.(true) : loaded ? slots.default?.(false) : null
    }
})