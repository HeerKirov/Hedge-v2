import { defineComponent, ref } from "vue"
import Input from "../../components/Input"

export default defineComponent({
    setup() {
        const useTouchId = ref(false)

        return () => <div class="v-login">
            <div class="title-bar"></div>
            <div class="fixed center has-text-centered">
                {useTouchId.value ?     
                    <div class="has-text-centered">
                        <i class="fa fa-3x fa-fingerprint mb-4"/>
                        <div class="is-size-6">正在通过touch ID认证</div>
                    </div>
                :
                    <div class="field is-grouped">
                        <p class="control is-expanded">
                            <Input class="is-small has-text-centered" type="password"/>{/*用is-danger表示密码错误*/}
                        </p>
                        <p class="control">
                            <button class="button is-small is-success"><span class="icon"><i class="fa fa-check"/></span></button>
                        </p>
                    </div>
                }
            </div>
        </div>
    }
})