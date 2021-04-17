import { defineComponent, PropType } from "vue"

/**
 * 多个input的竖排列表，带有删除按钮。
 */
export default defineComponent({
    props: {
        value: {type: null as any as PropType<string[]>, default: []}
    },
    emits: [],
    setup(props, { emit }) {
        return () => <>
        </>
    }
})
