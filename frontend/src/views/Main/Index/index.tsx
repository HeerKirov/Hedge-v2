import { defineComponent } from "vue"
import { TopBar } from "@/layouts/SideLayout"

export default defineComponent({
    setup() {
        return () => <div class="group pl-2 pt-2">
            <div style="margin-top: 40px">
                <button class="button"><span class="icon"><i class="fa fa-bars fa-lg"/></span><span>测试</span></button>
                <button class="button square"><span class="icon"><i class="fa fa-bars fa-lg"/></span></button>
                <button class="button">测试文本</button>
                <button class="button is-small">测试文本</button>
            </div>
            <TopBar>
                hello
            </TopBar>
        </div>
    }
})