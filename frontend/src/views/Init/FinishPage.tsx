import { defineComponent, inject, ref, Ref } from "vue"
import { InitContextInjection } from './inject'
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const context = inject(InitContextInjection)!

        const status = ref<"data" | "resource" | "starting" | "finished">("finished")

        return () => status.value === "finished"? <>
            <h2 class="is-size-5 mb-2">完成</h2> 
            <div class="has-text-centered absolute center">
                <i class="fa fa-3x fa-check mb-4"/>
                <div>初始化已完成。点击继续开始使用。</div>
            </div>
            <div class={style.bottom}>
                <button class="button is-link absolute right-bottom">继续<i class="fa fa-hand-peace ml-2"/></button>
            </div>
        </> : <div class="has-text-centered absolute center">
            <span class="icon"><i class="fa fa-3x fa-code-branch"/></span>
            <p class="mt-4">{loadingMessage[status.value]}</p>
        </div>
    }
})

const loadingMessage = {
    "data": "正在构建App数据……",
    "resource": "正在更新App资源……",
    "starting": "正在启动服务……"
}