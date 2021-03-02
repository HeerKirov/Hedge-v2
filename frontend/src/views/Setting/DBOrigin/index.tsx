import { defineComponent, InjectionKey, provide, Ref } from "vue"
import { useSettingSite } from "@/functions/server-api/setting"
import SiteBoard from "./SiteBoard"
import SpiderBoard from "./SpiderBoard"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        provide(settingSiteInjection, useSettingSite())

        return () => <div class={style.root}>
            <p class="mb-2 is-size-medium">来源站点</p>
            <SiteBoard/>
            <p class="mt-3 mb-2 is-size-medium">爬虫选项</p>
            <SpiderBoard/>
        </div>
    }
})

export const settingSiteInjection: InjectionKey<ReturnType<typeof useSettingSite>> = Symbol()