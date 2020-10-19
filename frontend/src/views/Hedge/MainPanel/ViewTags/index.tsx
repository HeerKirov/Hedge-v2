import { defineComponent, ref } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import TagTree from "./TagTree"
import "./style.scss"
import TagDetail from "./TagDetail"

export default defineComponent({
    setup() {
        const showDetail = ref(true)

        return () => <div id="hedge-tags">
            <div class="v-columns">
                <TagTree/>
                {showDetail.value && <TagDetail/>}
            </div>
            <TopBar>
                {() => <TopBarContent editorMode={showDetail.value} onUpdateEditorMode={(v: boolean) => showDetail.value = v}/>/*测试用。实际编辑模式与边栏无关 */}
            </TopBar>
        </div>
    }
})