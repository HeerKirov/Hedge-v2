import { defineComponent } from "vue"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        return () => <div class="middle-layout">
            <div class="middle single-line-group">
                <Input class="no-drag fullwidth"/>
            </div>
            <div class="middle-right single-line-group">
                <button class="square button no-drag radius-large is-white"><span class="icon"><i class="fa fa-plus"/></span></button>
            </div>
            <div class="right single-line-group">
                <button class="square button no-drag radius-large is-white"><span class="icon"><i class="fa fa-plus"/></span></button>
                <button class="square button no-drag radius-large is-white"><span class="icon"><i class="fa fa-grip-vertical"/></span></button>
            </div>
        </div>
    }
})