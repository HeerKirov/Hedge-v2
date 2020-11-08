import { defineComponent, provide, Ref, ref } from "vue"
import { InitContextInjection, useInitContext } from './inject'
import WelcomePage from "./WelcomePage"
import PasswordPage from "./PasswordPage"
import DBPage from './DBPage'
import ReadyPage from './ReadyPage'
import FinishPage from './FinishPage'
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = useInitContext(0)

        provide(InitContextInjection, context)

        const pages = [WelcomePage, PasswordPage, DBPage, ReadyPage, FinishPage]

        return () => {
            const CurrentPage = pages[context.page.num.value]

            return <div class={style.root}>
                <div class="title-bar has-text-centered">
                    <span>HEDGE</span>
                </div>
                <div class={[style.dialog, "fixed", "center", "box"]}>
                <CurrentPage/>
                </div>
            </div>
        }
    }
})