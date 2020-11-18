import { defineComponent, inject, ref } from "vue"
import { InitContextInjection } from "./inject"
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(InitContextInjection)!

        const hasPassword = ref(true)

        const password = ref("")
        const checkPassword = ref("")

        const next = () => {
            context.page.next()
        }
        
        return () => <>
            <h2 class="is-size-5 mb-2">设置口令</h2>
            <p>设定登录口令，每次打开App之前都会进行验证，阻止不希望的访问。</p>
            {hasPassword.value ? <>
                <div class="field mt-2">
                    <label class="label">输入口令</label>
                    <div class="control"><Input class="is-small" type="password" value={password.value} onUpdateValue={v => password.value = v}/></div>
                </div>
                <div class="field">
                    <label class="label">确认口令</label>
                    <div class="control"><Input class="is-small" type="password"/></div>
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