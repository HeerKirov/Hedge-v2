import { computed, defineComponent, inject, PropType, ref, watch } from "vue"
import { Site, SpiderRule } from "@/functions/adapter-http/impl/setting-source"
import { useElementPopupMenu } from "@/functions/app"
import { useMessageBox } from "@/functions/module"
import { useSettingSpider, useSettingSpiderUsableRules } from "../setting"
import Select from "@/components/forms/Select"
import SelectList from "@/components/forms/SelectList"
import CheckBox from "@/components/forms/CheckBox"
import NumberInput from "@/components/forms/NumberInput"
import { settingSiteInjection } from "."
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { data: sites } = inject(settingSiteInjection)!
        const selectedSiteName = ref<string>()
        const { siteList, publicRule, selectedSite } = useSettingSpider(sites, selectedSiteName)

        const tempAddItem = ref<{name: string, value: string}>()
        const items = computed(() => {
            const global = {name: "全局配置", value: "GLOBAL"}
            const mainItems = siteList.value.map(({ name, title }) => ({name: title, value: `_${name}`}))
            return tempAddItem.value ? [global, ...mainItems, tempAddItem.value] : [global, ...mainItems]
        })
        const selected = ref<string>()
        const select = (v: string | undefined) => {
            if(v === undefined) {
                selectedSiteName.value = undefined
                selected.value = undefined
            }else if(selected.value !== v) {
                if(v.startsWith("_")) {
                    selectedSiteName.value = v.substr(1)
                }else if(v === "GLOBAL") {
                    selectedSiteName.value = undefined
                }
                if(tempAddItem.value) tempAddItem.value = undefined
                selected.value = v
            }
        }

        const spiderEditorData = computed(() => ({
            global: selected.value === "GLOBAL",
            rule: selected.value === "GLOBAL" ? undefined : (selectedSite.value?.rule ?? undefined),
            options: selected.value === "GLOBAL" ? publicRule.value : (selectedSite.value?.options ?? undefined),
            defaultOptions: publicRule.value
        }))

        const save = (rule: string | undefined, options: SpiderRule | undefined) => {
            if(selected.value == "GLOBAL") {
                publicRule.value = options
            }else{
                if(tempAddItem.value) tempAddItem.value = undefined
                selectedSite.value = rule ? {rule, options: options ?? null} : undefined
                if(rule === undefined) select(undefined)
            }
        }

        const addMenu = useElementPopupMenu(() => {
            const canAddSiteList = sites.value.filter(site => !siteList.value.find(s => s.name === site.name))
            if(canAddSiteList.length > 0) return canAddSiteList.map(site => ({ type: "normal", label: site.title, click: onAddItem(site) }))
            return [{ type: "normal", enabled: false, label: "(没有可用的站点)" }]
        })
        const onAddItem = (site: Site) => () => {
            tempAddItem.value = {name: site.title, value: `_${site.name}`}
            selectedSiteName.value = site.name
            selected.value = `_${site.name}`
        }

        return () => <div class={style.spiderBoard}>
            <div class={style.left}>
                <SelectList class={style.leftList} value={selected.value} items={items.value} onUpdateValue={select} allowCancel={false}/>
                <div class={style.leftBottom}>
                    <button ref={addMenu.element} class="button has-border is-small is-white w-100" onClick={addMenu.popup}><span class="icon"><i class="fa fa-plus"/></span><span>新建规则</span></button>
                </div>
            </div>
            {selected.value && <div class={style.right}>
                <SpiderEditor {...spiderEditorData.value} onSave={save}/>
            </div>}
        </div>
    }
})

const SpiderEditor = defineComponent({
    props: {
        global: {type: Boolean, required: true},
        rule: String,
        options: null as any as PropType<SpiderRule>,
        defaultOptions: null as any as PropType<SpiderRule>
    },
    emits: ["save"],
    setup(props, { emit }) {
        const messageBox = useMessageBox()
        const usableRules = useSettingSpiderUsableRules()

        const rule = ref(props.rule)
        const optionsSwitch = ref(!!props.options)
        const options = ref(props.options && copyOptions(props.options))

        watch(() => props, () => {
            rule.value = props.rule
            options.value = props.options && copyOptions(props.options)
            optionsSwitch.value = !!props.options
        }, {deep: true})

        const setOptionsSwitch = (v: boolean) => {
            optionsSwitch.value = v
            if(v && !options.value) {
                options.value = props.defaultOptions ? copyOptions(props.defaultOptions) : {
                    useProxy: false,
                    disableProxyAfterTimes: null,
                    retryCount: 3,
                    tryInterval: 8000,
                    timeout: 15000
                }
            }
        }
        const setOptions = {
            onUpdateUseProxy(v: boolean) { options.value!.useProxy = v },
            onUpdateDisableProxyAfterTimes(v: number | null) { options.value!.disableProxyAfterTimes = v },
            onUpdateTimeout(v: number) { options.value!.timeout = v },
            onUpdateRetryCount(v: number) { options.value!.retryCount = v },
            onUpdateTryInterval(v: number) { options.value!.tryInterval = v }
        }

        const saveItem = () => {
            if(props.global) {
                emit("save", undefined, options.value!)
            }else{
                emit("save", rule.value, optionsSwitch.value ? options.value : undefined)
            }
        }
        const deleteItem = async () => {
            if(await messageBox.showYesNoMessage("提示", "确定要删除这一项配置吗？")) {
                emit("save", undefined, undefined)
            }
        }

        return () => props.global ? <div class="block h-100">
            {options.value && <SpiderRequestConfiguration {...options.value} {...setOptions}/>}
            <div class="group mt-3">
                <button class="button is-small is-info" onClick={saveItem}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
            </div>
        </div> : <div class="block h-100">
            <div>
                <label class="label">应用规则</label>
                <Select items={usableRules.value} value={rule.value} onUpdateValue={v => rule.value = v}/>
                <p class="is-size-8 has-text-grey">为来源站点指定一项已经定义在系统中的爬虫规则。</p>
            </div>
            <div class="mt-2">
                <CheckBox value={optionsSwitch.value} onUpdateValue={setOptionsSwitch}>使用专有请求配置</CheckBox>
                {optionsSwitch.value
                    ? <p class="is-size-8 has-text-grey">此站点的请求配置使用专有定义。</p>
                    : <p class="is-size-8 has-text-grey">此站点的请求配置使用全局配置。</p>
                }
            </div>
            {optionsSwitch.value && options.value && <SpiderRequestConfiguration {...options.value} {...setOptions}/>}
            <div class="group mt-3">
                <button class="button is-small is-info" onClick={saveItem}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
                <button class="square button is-small is-danger float-right" onClick={deleteItem}><span class="icon"><i class="fa fa-trash"/></span></button>
            </div>
        </div>
    }
})

const SpiderRequestConfiguration = defineComponent({
    props: {
        useProxy: {type: Boolean, required: true},
        disableProxyAfterTimes: {type: null as any as PropType<number | null>, required: true},
        timeout: {type: Number, required: true},
        retryCount: {type: Number, required: true},
        tryInterval: {type: Number, required: true},
    },
    emits: ["updateUseProxy", "updateDisableProxyAfterTimes", "updateTimeout", "updateRetryCount", "updateTryInterval"],
    setup(props, { emit }) {
        const updateTimeout = (v: number) => emit("updateTimeout", v)
        const updateTryInterval = (v: number) => emit("updateTryInterval", v)
        const updateRetryCount = (v: number) => emit("updateRetryCount", v)
        const updateUseProxy = (v: boolean) => emit("updateUseProxy", v)
        const updateDisableProxyAfterTimes = (v: number) => emit("updateDisableProxyAfterTimes", v)
        const updateDisableProxySwitch = (v: boolean) => emit("updateDisableProxyAfterTimes", v ? 1 : null)

        return () => <>
            <div>
                <label class="label">单次请求超时时长</label>
                <NumberInput class="is-small is-width-half" min={100} value={props.timeout} onUpdateValue={updateTimeout}/><span class="ml-1">毫秒</span>
                <p class="is-size-8 has-text-grey">请求时间超过限额时，认为本次连接失败。设置适当的值，防止慢请求被阻断，并防止无法连接的请求长期等待拖慢效率。</p>
            </div>
            <div class="mt-1">
                <label class="label">请求间隔</label>
                <NumberInput class="is-small is-width-half" min={0} value={props.tryInterval} onUpdateValue={updateTryInterval}/><span class="ml-1">毫秒</span>
                <p class="is-size-8 has-text-grey">每两个任务之间主动空出一定的时间间隔，防止因请求过快而被BAN。</p>
            </div>
            <div class="mt-1">
                <label class="label">失败重试次数</label>
                <NumberInput class="is-small is-width-half" min={0} value={props.retryCount} onUpdateValue={updateRetryCount}/>
                <p class="is-size-8 has-text-grey">因各种原因请求失败时，重试几次，防止偶发性问题。</p>
            </div>
            <div class="mt-1">
                <label class="label">代理设置</label>
                <div class="mt-1">
                    <CheckBox value={props.useProxy} onUpdateValue={updateUseProxy}>使用代理</CheckBox>
                    <p class="is-size-8 has-text-grey">勾选此选项，使此种类爬虫通过代理请求。</p>
                </div>
                <div class="mt-1">
                    <CheckBox value={props.disableProxyAfterTimes != null} onUpdateValue={updateDisableProxySwitch}>连接失败后尝试直连 (</CheckBox>
                    <NumberInput class="is-small is-width-one-third" min={1} value={props.disableProxyAfterTimes ?? 0} onUpdateValue={updateDisableProxyAfterTimes} disabled={props.disableProxyAfterTimes == null}/>
                    <span class="is-size-medium">次失败后)</span>
                    <p class="is-size-8 has-text-grey">在经过几次失败尝试后，认为是代理有问题，从而采取直连策略。将此值设置得比失败重试次数大是没有意义的。</p>
                </div>
            </div>
        </>
    }
})

function copyOptions(options: SpiderRule): SpiderRule {
    return {
        useProxy: options.useProxy,
        disableProxyAfterTimes: options.disableProxyAfterTimes,
        timeout: options.timeout,
        retryCount: options.retryCount,
        tryInterval: options.tryInterval
    }
}
