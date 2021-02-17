import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout, { SideBar } from "@/layouts/SideLayout"
import SideBarContent from "./SideBarContent"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => {
            const sideLayoutSlots = {
                side() {
                    return <SideBar secondaryMode={true}>
                        <SideBarContent/>
                    </SideBar>
                },
                default() {
                    return <div class={style.content}>
                        <div class={[style.scrollContent]}>
                            <RouterView/>
                        </div>
                        <div class="small-title-bar absolute top w-100"/>
                    </div>
                }
            }
            return <div class={style.root}>
                <SideLayout v-slots={sideLayoutSlots}/>
            </div>
        }
    }
})