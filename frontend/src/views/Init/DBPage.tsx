import { defineComponent, inject, ref, Ref } from "vue"
import { InitContextInjection } from './inject'
import Input from "@/components/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(InitContextInjection)!

        const isCustom = ref(false)
        const folderInAppData = ref("default")
        const customfolderPath = ref("")

        return () => <>
            <h2 class="is-size-5 mb-2">创建数据库</h2> 
            <p>Hedge以数据库为单位管理资料。第一个数据库默认将存放在App数据目录下。</p>
            {isCustom.value ? <>
                <p class="mt-4 is-size-7">已选择在自定义的位置保存数据库。请指定一个文件夹作为数据库的存储文件夹。</p>
                <div class="field is-grouped mt-5">
                    <p class="control is-expanded">
                        <Input class="is-small" value={customfolderPath.value} onUpdateValue={v => customfolderPath.value = v}/>
                    </p>
                    <p class="control">
                        <button class="button is-small is-info"><i class="fa fa-folder-open mr-1"/>选择文件夹…</button>
                    </p>
                </div>
            </> : <>
                    <div class="field mt-2">
                        <label class="label">数据库名称</label>
                        <Input class="is-small" value={folderInAppData.value} onUpdateValue={v => folderInAppData.value = v}/>
                    </div>
                    <p class="is-size-7"><a onClick={() => isCustom.value = true}>在自定义位置保存数据库</a></p>
            </>}
            <div class={style.bottom}>
                <button class="button is-link is-light absolute left-bottom" onClick={context.page.prev}><i class="fa fa-arrow-left mr-2"/>上一步</button>
                <button class="button is-link absolute right-bottom" onClick={context.page.next}>下一步<i class="fa fa-arrow-right ml-2"/></button>
            </div>
        </>
    }
})