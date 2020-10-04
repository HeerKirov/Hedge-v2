import { defineComponent } from "vue"
import Input from "../../../components/Input"

export default defineComponent({
    setup() {
        return () => <div class="control is-expanded has-icons-left">
            <Input class="is-rounded is-small no-drag"/>
            <span class="icon is-small is-left"><i class="fa fa-superscript"/></span>
        </div>
    }
})