import { defineComponent } from "vue"
import Input from "@/components/Input"

export default defineComponent({
    setup() {
        return () => <div>
            <div class="notification">
                <p><i class="fa fa-sync mr-1"/>备份机制: 已启用</p>
                <p class="is-size-7 mt-4">备份与还原工具是Hedge的一项工具功能，可以将本机数据库完整地增量备份至另一个硬盘位置，或者从备份恢复一整个数据库。</p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-clock mr-2"/>上次备份时间<span class="is-family-code ml-1 mr-4">2020年11月1日 23:59:59</span>
                </p>
                <button class="button is-small mt-4 is-white"><i class="fa fa-sync mr-2"/>开始备份</button>
                <button class="button is-small mt-4 ml-1 is-white"><i class="fa fa-redo mr-2"/>从备份还原</button>
            </div>
            <p class="mb-3">备份与还原选项</p>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>启用备份
                </label>
                <p class="is-size-7 has-text-grey">启用备份，并指定一个备份目标文件夹。</p>
            </div>
            <div class="field is-grouped">
                <p class="control is-expanded">
                    <Input class="is-small"/>
                </p>
                <p class="control">
                    <button class="button is-small is-info"><i class="fa fa-folder-open mr-1"/>选择文件夹…</button>
                </p>
            </div>
            <div class="field">
                <label class="checkbox">
                    <input type="checkbox" class="mr-1"/>自动备份
                </label>
                <p class="is-size-7 has-text-grey">在闲时，自动将最新的更改备份到目标文件夹。</p>
            </div>
        </div>
    }
})