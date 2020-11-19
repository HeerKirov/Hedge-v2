import { defineComponent, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useAppState } from "@/functions/service"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        const router = useRouter()
        const appState = useAppState()

        const useTouchId = ref(appState.canPromptTouchID)

        const password = ref("")
        const passwordWrong = ref(false)
        const disabled = ref(false)

        const doLogin = async () => {
            disabled.value = true
            passwordWrong.value = false
            const res = await appState.login(password.value)
            if(res) {
                router.push({name: "Index"})
            }else{
                disabled.value = false
                passwordWrong.value = true
            }
        }
        const enter = async (e: KeyboardEvent) => {
            if(e.key === "Enter") {
                await doLogin()
            }
        }

        onMounted(async () => {
            if(useTouchId.value) {
                const res = await appState.loginByTouchID()
                if(res) {
                    router.push({name: "Index"})
                }else{
                    useTouchId.value = false
                }
            }
        })

        return () => <div id="login">
            <div class="title-bar has-text-centered">
                <span>HEDGE</span>
            </div>
            <div class="fixed center has-text-centered">
                {useTouchId.value ?     
                    <div class="has-text-centered">
                        <i class="fa fa-3x fa-fingerprint mb-4"/>
                        <div class="is-size-6">正在通过touch ID认证</div>
                    </div>
                :
                    <div class="field is-grouped">
                        <p class="control is-expanded">
                            <Input class={{"is-small": true, "has-text-centered": true, "is-danger": passwordWrong.value}} type="password" value={password.value} onUpdateValue={v => password.value = v} onKeydown={enter}/>
                        </p>
                        <p class="control">
                            <button class="button is-small is-success" onClick={doLogin}><span class="icon"><i class="fa fa-check"/></span></button>
                        </p>
                    </div>
                }
            </div>
        </div>
    }
})