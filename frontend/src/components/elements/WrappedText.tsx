import { defineComponent } from "vue"

/**
 * 处理换行符的文本段落。
 */
export default defineComponent({
    props: {
        value: String
    },
    inheritAttrs: false,
    setup(props, { attrs }) {
        return () => props.value ? <>
            {props.value.split('\n').map(line => <p {...attrs}>{line}</p>)}
        </> : <p {...attrs}/>
    }
})
