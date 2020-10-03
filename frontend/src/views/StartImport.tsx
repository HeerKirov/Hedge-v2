import { defineComponent } from "vue"
import Input from "./components/Input"
import BottomBar from "./layouts/Start/BottomBar"

export default defineComponent({
    setup() {
        return () => <div class="v-start-import">
            <div class="v-dialog absolute center">
                <h1 class="subtitle">导入外部数据库</h1>
                <p>将外部已存在的数据库文件夹添加到数据库列表中。</p>
                <div class="field is-grouped mt-5">
                    <p class="control is-expanded">
                        <Input class="is-small"/>
                    </p>
                    <p class="control">
                        <button class="button is-small is-info"><i class="fa fa-folder-open mr-1"/>选择文件夹…</button>
                    </p>
                </div>
                <p class="mt-4"><b>数据库名称</b> default</p>
                <p class="mt-2"><b>描述</b> ...</p>
                <button class="button is-info is-small mt-4"><i class="fa fa-check mr-1"/>确认导入</button>
            </div>
            <BottomBar/>
        </div>
    }
})