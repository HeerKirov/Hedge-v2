import { defineComponent, ref } from "vue"
import Login from './layouts/Index/Login'
import InitView from './layouts/Index/Init'

export default defineComponent({
    setup() {
        const initView = ref(true)
        return () => <div class="v-index">
            <div class="title-bar"></div>
            {initView.value ?
                <InitView/>
                :
                <Login/>
            }
        </div>
    }
})