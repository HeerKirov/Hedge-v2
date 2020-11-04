import { defineComponent } from "vue"
import { RouterView } from "vue-router"
import ColumnGrid from '@/components/ColumnGrid'
import style from "./style.module.scss"

import img1 from "@/assets/img1.local.jpg"

export default defineComponent({
    setup() {
        return () => <div id="start" class={style.start}>
            <div class="title-bar has-text-centered">
                <span>HEDGE</span>
            </div>
            <div class={[style.content]}>
                <div class={style.left}>
                    <div class={[style.hoverable, "notification"]}>
                        <p class="is-size-5"><i class="fa fa-th mr-5"/><span>图库</span></p>
                        {/* <ColumnGrid class="mt-4" column={6}>
                            <img class={style.image} src={img1}/>
                            <img class={style.image} src={img1}/>
                        </ColumnGrid> */}
                    </div>
                </div>
                <div class={style.right}>
                    <ImportBox/>
                    <SpiderBox/>
                    <FileManagerBox/>
                    <BackupBox/>
                </div>
            </div>
        </div>
    }
})

const ImportBox = defineComponent({
    setup() {
        return () => <div class={[style.hoverable, "notification", "is-success", "is-light"]/*有项目时深色*/}>
            <p class="is-size-5"><i class="fa fa-file-import mr-5"/><span>导入</span></p>
            <p class="mt-3 mb-1">125个待处理的项目</p>
            <ColumnGrid column={4}>
                <img class={style.image} src={img1}/>
                <img class={style.image} src={img1}/>
                <img class={style.image} src={img1}/>
                <img class={style.image} src={img1}/>
            </ColumnGrid>
            
        </div>
    }
})

const SpiderBox = defineComponent({
    setup() {
        return () => <div class={[style.hoverable, "notification", "is-info"]/*有项目时深色*/}>
            <p class="is-size-5"><i class="fa fa-spider mr-5"/><span>爬虫</span></p>
            <nav class="level mt-3 mb-2">
                <div class="level-left">爬虫工作中……</div>
                <div class="level-right">45/105</div>
            </nav>
            <progress class="progress is-small" max="100" value="28"></progress>
        </div>
    }
})

const FileManagerBox = defineComponent({
    setup() {
        return () => <div class={[style.hoverable, "notification", "is-primary", "is-light"]}>
            <p class="is-size-5"><i class="fa fa-file mr-5"/><span>文件管理</span></p>
            <div class="columns mt-2">
                <div class="column is-half">
                    <span class="is-size-7 mr-2">文件数量</span><span class="is-size-5 is-family-code">65786</span>
                </div>
                <div class="column is-half">
                    <span class="is-size-7 mr-2">文件容量</span><span class="is-size-5 is-family-code">65.4G</span>
                </div>
            </div>
        </div>
    }
})

const BackupBox = defineComponent({
    setup() {
        return () => <div class={[style.hoverable, "notification", "is-warning", "is-light"]/*有项目时深色*/}>
            <p class="is-size-5"><i class="fa fa-sync mr-5"/><span>备份</span></p>
            <nav class="level mt-3 mb-2">
                <div class="level-left">正在复制数据库……</div>
                <div class="level-right">75%</div>
            </nav>
            <progress class="progress is-small" max="100" value="28"></progress>
        </div>
    }
})