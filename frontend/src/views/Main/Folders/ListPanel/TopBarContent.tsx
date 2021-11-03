import { defineComponent } from "vue"
import { SearchBox } from "@/layouts/topbars"

export default defineComponent({
    setup() {
        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <button class="button square no-drag radius-large is-white">
                    <i class="fa fa-plus"/>
                </button>
                <button class="button square no-drag radius-large is-white">
                    <i class="fa fa-lock"/>
                </button>
            </div>
        </div>
    }
})
