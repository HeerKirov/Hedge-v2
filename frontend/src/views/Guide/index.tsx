import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "@/layouts/SideLayout"
import SideBar from "./SideBar"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <SideLayout v-slots={{side: () => <SideBar/>}}>
                <div class={style.content}>
                    <div class={[style.scrollContent, "container"]}>
                        <RouterView/>
                    </div>
                    <div class="small-title-bar absolute top w-100"/>
                </div>
            </SideLayout>
        </div>
    }
})