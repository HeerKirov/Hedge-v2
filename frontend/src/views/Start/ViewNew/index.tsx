import { defineComponent } from "vue"
import Input from "@/components/Input"
import BottomBar from "../BottomBar"
import "./style.scss"

export default defineComponent({
    setup() {
        return () => <div id="start-new">
            <div class="v-dialog absolute center">
                <h1 class="subtitle">新建数据库</h1>
                <p>创建一个新数据库。</p>
                <div class="field is-grouped mt-5">
                    <p class="control is-expanded">
                        <Input class="is-small" placeholder="存放位置"/>
                    </p>
                    <p class="control">
                        <button class="button is-small is-info"><i class="fa fa-folder-open mr-1"/>选择文件夹…</button>
                    </p>
                </div>
                <div class="field mt-5">
                    <p class="control">
                        <Input class="is-small" placeholder="数据库名称"/>
                    </p>
                </div>
                <div class="field mt-5">
                    <p class="control">
                        <Input class="is-small" placeholder="描述"/>
                    </p>
                </div>
                <button class="button is-info is-small mt-4"><i class="fa fa-check mr-1"/>确认创建</button>
            </div>
            <BottomBar/>
        </div>
    }
})