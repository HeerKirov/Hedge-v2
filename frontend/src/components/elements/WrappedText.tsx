import { defineComponent } from "vue"

/**
 * 处理换行符的文本段落。
 */
export default defineComponent({
    props: {
        value: String
    },
    setup(props) {
        return () => props.value ? <>
            {props.value.split('\n').map(line => <p>{line}</p>)}
        </> : <p/>
    }
})