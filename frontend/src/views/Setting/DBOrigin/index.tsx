import { defineComponent, PropType, ref, watch } from "vue"
import { useSettingMeta, useSettingSourceSpider } from "@/functions/server-api/setting"
import Input from "@/components/Input"
import CheckBox from "@/components/CheckBox"
import NumberInput from "@/components/NumberInput"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <p class="mb-2 is-size-medium">来源站点</p>
            <SiteBoard/>
            <p class="mt-3 mb-2 is-size-medium">爬虫选项</p>
            <SpiderBoard/>
        </div>
    }
})

const SiteBoard = defineComponent({
    props: {
    },
    emits: ["update"],
    setup(props, { emit }) {
        return () => <div class={style.siteBoard}>
            <div class={style.left}>

            </div>
            <div class={style.right}>

            </div>
        </div>
    }
})

const SpiderBoard = defineComponent({
    props: {
    },
    emits: ["update"],
    setup(props, { emit }) {
        const { loading, data } = useSettingSourceSpider()

        return () => loading.value ? <div/> : <div class={style.siteBoard}>
            <div class={style.left}>

            </div>
            <div class={style.right}>

            </div>
        </div>
    }
})