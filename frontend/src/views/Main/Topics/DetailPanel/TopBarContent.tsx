import { defineComponent } from "vue"
import { useTopicContext } from "../inject"

export default defineComponent({
    setup() {
        const { closePane } = useTopicContext()

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white" onClick={closePane}>
                    <span class="icon"><i class="fa fa-arrow-left"/></span>
                </button>
            </div>

            <div class="layout-container">
                {/*在这里添加favorite按钮*/}
            </div>
        </div>
    }
})