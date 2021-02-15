import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import { watchDocumentTitle } from "@/functions/document/title"

export default defineComponent({
    setup() {
        watchDocumentTitle()

        return () => <div style="padding-top: 2rem" class="buttons">
            <button class="button is-medium is-light">测试</button>
            <button class="button is-side">测试</button>
            <button class="button is-white">test</button>
            <button class="button icon radius-circle"><i class="fa fa-folder-plus"/></button>
            <input class="input"/>
            <div>
                你好，<a href="#">测试Link</a>，世界
            </div>
        </div>
    }
})