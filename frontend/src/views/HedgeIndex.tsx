import { defineComponent, inject } from "vue"
import { sideBarSwitchInjection } from "./Hedge"

export default defineComponent({
    setup() {
        const sideBarSwitch = inject(sideBarSwitchInjection)

        return () => <div class="v-hedge-index">
            <div class="title-bar absolute top w-100"></div>
            <button onClick={() => sideBarSwitch.value = !sideBarSwitch.value} class="button m-6">{sideBarSwitch.value ? "关闭" : "开启"}</button>
        </div>
    }
})