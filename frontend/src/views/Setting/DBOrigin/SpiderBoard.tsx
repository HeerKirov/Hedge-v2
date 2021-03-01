import { computed, defineComponent } from "vue"
import { useSettingSpider, useSettingSpiderUsableRules } from "@/functions/server-api/setting"
import Select from "@/components/Select"
import SelectList from "@/components/SelectList"
import CheckBox from "@/components/CheckBox"
import NumberInput from "@/components/NumberInput"
import style from "@/views/Setting/DBOrigin/style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingSpider()

        const items = computed(() => [{name: "全局配置", value: "GLOBAL"}])

        return () => loading.value ? <div/> : <div class={style.spiderBoard}>
            <div class={style.left}>
                <SelectList class="h-100" items={items.value} allowCancel={false}/>
            </div>
            <div class={style.right}>
                <SpiderEditor/>
            </div>
        </div>
    }
})

const SpiderEditor = defineComponent({
    setup() {
        const usableRules = useSettingSpiderUsableRules()

        return () => <div class="block h-100">
            <div>
                <label class="label">应用规则</label>
                <Select items={usableRules.value}/>
                <p class="is-size-8 has-text-grey">为来源站点指定一项已经定义在系统中的爬虫规则。</p>
            </div>
            <div class="mt-2">
                <CheckBox>使用全局请求配置</CheckBox>
                <p class="is-size-8 has-text-grey">此站点的请求配置使用全局配置。</p>
                <p class="is-size-8 has-text-grey">此站点的请求配置使用专有定义。</p>
            </div>
            <SpiderRequestConfiguration/>
        </div>
    }
})

const SpiderRequestConfiguration = defineComponent({
    setup() {
        return () => <>
            <div class="mt-2">
                <label class="label">单次请求超时时长</label>
                <NumberInput class="is-small is-width-half" min={100}/><span class="ml-1">毫秒</span>
                <p class="is-size-8 has-text-grey">请求时间超过限额时，认为本次连接失败。设置适当的值，防止慢请求被阻断，并防止无法连接的请求长期等待拖慢效率。</p>
            </div>
            <div class="mt-1">
                <label class="label">请求间隔</label>
                <NumberInput class="is-small is-width-half" min={0}/><span class="ml-1">毫秒</span>
                <p class="is-size-8 has-text-grey">每两个任务之间主动空出一定的时间间隔，防止因请求过快而被BAN。</p>
            </div>
            <div class="mt-1">
                <label class="label">失败重试次数</label>
                <NumberInput class="is-small is-width-half" min={0}/>
                <p class="is-size-8 has-text-grey">因各种原因请求失败时，重试几次，防止偶发性问题。</p>
            </div>
            <div class="mt-1">
                <label class="label">代理设置</label>
                <div class="mt-1">
                    <CheckBox>使用代理</CheckBox>
                    <p class="is-size-8 has-text-grey">勾选此选项，使此种类爬虫通过代理请求。</p>
                </div>
                <div class="mt-1">
                    <CheckBox>连接失败后尝试直连 (</CheckBox>
                    <NumberInput class="is-small is-width-one-third" min={1}/>
                    <span class="is-size-medium">次失败后)</span>
                    <p class="is-size-8 has-text-grey">在经过几次失败尝试后，认为是代理有问题，从而采取直连策略。将此值设置得比失败重试次数大是没有意义的。</p>
                </div>
            </div>
            <div class="group mt-3">
                <button class="button is-small is-info"><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
                <button class="square button is-small is-danger float-right"><span class="icon"><i class="fa fa-trash"/></span></button>
            </div>
        </>
    }
})