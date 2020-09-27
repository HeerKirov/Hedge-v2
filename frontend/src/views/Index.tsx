import { defineComponent } from "vue"
import HelloWorld from '../components/HelloWorld'

export default defineComponent({
    setup() {
        return () => <>
            <div class="title-bar"></div>
            <HelloWorld msg="Hello Vue 3.0 + Vite"/>
        </>
    }
})