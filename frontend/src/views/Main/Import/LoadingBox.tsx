import { defineComponent } from "vue"
import BlockBox from "@/layouts/layouts/BlockBox"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <BlockBox visible={true}>
            <Content/>
        </BlockBox>
    }
})

const Content = defineComponent({
    setup() {
        return () => <div class={style.loadingBox}>
            <p class={style.title}>正在导入…</p>
            <p class={style.number}>255/655</p>
            <progress class="progress is-info is-small" value={255} max={655}/>
            <div class={style.buttons}>
                <button class="button is-white is-small">
                    <span class="icon"><i class="fa fa-times"/></span>
                    <span>取消</span>
                </button>
            </div>
        </div>
    }
})
