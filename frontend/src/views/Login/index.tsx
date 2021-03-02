import { defineComponent, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { State } from "@/functions/adapter-ipc"
import { useAppInfo, useAppState } from "@/functions/service"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        const router = useRouter()
        const appInfo = useAppInfo()
        const appState = useAppState()

        const useTouchId = ref(appInfo.canPromptTouchID)

        const password = ref("")
        const passwordWrong = ref(false)
        const disabled = ref(false)

        const doLogin = async () => {
            disabled.value = true
            passwordWrong.value = false
            const res = await appState.login(password.value)
            if(res) {
                await router.push({name: "Index"})
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
            if(appState.state.value !== State.NOT_LOGIN) {
                await router.push({name: "Index"})
            }
            if(useTouchId.value) {
                const res = await appState.loginByTouchID()
                if(res) {
                    await router.push({name: "Index"})
                }else{
                    useTouchId.value = false
                }
            }
        })

        return () => <div>
            <div class="title-bar has-text-centered is-size-large">
                <span>HEDGE</span>
            </div>
            <div class="fixed center has-text-centered">
                {useTouchId.value ? <div>
                    <i class="fa fa-3x fa-fingerprint mb-4"/>
                    <div class="is-size-medium">正在通过touch ID认证</div>
                </div> : <div class="group">
                    <Input class={{"has-text-centered": true, "is-width-small": true, "is-danger": passwordWrong.value}} type="password" focusOnMounted={true} refreshOnInput={true} value={password.value} onUpdateValue={v => password.value = v} onKeydown={enter}/>
                    <button class="square button is-success" onClick={doLogin}><span class="icon"><i class="fa fa-check"/></span></button>
                </div>}
            </div>
        </div>
    }
})