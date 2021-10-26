import { defineComponent } from "vue"
import { SideBar } from "@/layouts/layouts/SideLayout"

export default function() {
    return <SideBar>
        <SideBarDetailInfo/>
    </SideBar>
}

const SideBarDetailInfo = defineComponent({
    setup() {
        return () => <div>
            <p><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{101}</b></p>
        </div>
    }
})
