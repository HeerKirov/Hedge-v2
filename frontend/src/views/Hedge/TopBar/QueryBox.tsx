import { defineComponent } from "vue"
import Input from "../../../components/Input"

/**
 * 定义好了样式的查询框。定义了半圆的样式。虽然业务逻辑在不同的顶栏中不一定通用，但外形是一样的。
 */
export default defineComponent({
    props: {
        placeholder: String,
        icon: String
    },
    setup(props) {
        return () => <div class="control is-expanded has-icons-right">
            <Input class="is-rounded is-small no-drag is-family-monospace" placeholder={props.placeholder ?? ""}/>
            <span class="icon is-right"><i class={`fa fa-${props.icon ?? "superscript"}`}/></span>
        </div>
    }
})