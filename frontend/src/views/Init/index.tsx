import { defineComponent, provide } from "vue"
import { clientMode } from "@/functions/app"
import NotFoundNotification from "@/layouts/layouts/ForbiddenNotification"
import { initContextInjection, useInitContext } from "./inject"
import WelcomePage from "./WelcomePage"
import PasswordPage from "./PasswordPage"
import DBPage from './DBPage'
import FinishPage from './FinishPage'
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        if(clientMode) {
            const context = useInitContext(0)

            provide(initContextInjection, context)

            const pages = [WelcomePage, PasswordPage, DBPage, FinishPage]

            return () => {
                const CurrentPage = pages[context.page.num.value]

                return <div class={style.root}>
                    <div class="title-bar line has-text-centered is-size-large">
                        <span>HEDGE</span>
                    </div>
                    <div class={[style.dialog, "fixed", "center", "box"]}>
                        <CurrentPage/>
                    </div>
                </div>
            }
        }else{
            return () => <NotFoundNotification reason="FORBIDDEN_IN_WEB"/>
        }
    }
})
