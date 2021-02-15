import { defineComponent, inject, ref } from "vue"
import { InitContextInjection } from "./inject"
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(InitContextInjection)!

        const hasPassword = ref(context.password.hasPassword)
        const password = ref(context.password.value)
        const checkPassword = ref(context.password.value)
        const passwordErrorMessage = ref<string>()
        const checkPasswordErrorMessage = ref<string>()

        const next = () => {
            passwordErrorMessage.value = undefined
            checkPasswordErrorMessage.value = undefined
            if(hasPassword.value) {
                if(password.value === "") {
                    passwordErrorMessage.value = "口令不能设置为空。如果不想使用口令，请选择“不设置口令”"
                    return
                }else if(password.value !== checkPassword.value) {
                    checkPasswordErrorMessage.value = "确认口令与输入的口令不一致"
                    return
                }
                context.password.value = password.value
                context.password.hasPassword = true
            }else{
                context.password.hasPassword = false
            }
            context.page.next()
        }

        return () => <>
            <h2 class="is-size-5 mb-2">设置口令</h2>
            <p>设定登录口令，每次打开App之前都会进行验证，阻止不希望的访问。</p>
            {hasPassword.value ? <>
                <div class="field mt-2">
                    <label class="label">输入口令</label>
                    <div class="control"><Input class={{"is-small": true, "is-danger": !!passwordErrorMessage.value}} type="password" value={password.value} onUpdateValue={v => password.value = v}/></div>
                    {passwordErrorMessage.value && <p class="help is-danger">{passwordErrorMessage.value}</p>}
                </div>
                <div class="field">
                    <label class="label">确认口令</label>
                    <div class="control"><Input class={{"is-small": true, "is-danger": !!checkPasswordErrorMessage.value}} type="password" value={checkPassword.value} onUpdateValue={v => checkPassword.value = v}/></div>
                    {checkPasswordErrorMessage.value && <p class="help is-danger">{checkPasswordErrorMessage.value}</p>}
                </div>
                <p class="is-size-7"><a onClick={() => hasPassword.value = false}>不设置口令</a></p>
            </> : <>
                <p class="is-size-7 mt-4">您选择了不设置口令。App打开时不会进行验证，允许任何访问。</p>
                <p class="is-size-7 mt-4"><a onClick={() => hasPassword.value = true}>设置口令</a></p>
            </>
            }
            <div class={style.bottom}>
                <button class="button is-link absolute right-bottom" onClick={next}>下一步<i class="fa fa-arrow-right ml-2"/></button>
            </div>
        </>
    }
})