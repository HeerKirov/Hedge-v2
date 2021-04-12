import { computed, defineComponent, inject, PropType, ref, watch } from "vue"
import { SourceAnalyseRule } from "@/functions/adapter-http/impl/setting-import"
import { Site } from "@/functions/adapter-http/impl/setting-source"
import { useElementPopupMenu } from "@/functions/app"
import { useMessageBox } from "@/functions/module"
import Input from "@/components/Input"
import Select from "@/components/Select"
import SelectList from "@/components/SelectList"
import NumberInput from "@/components/NumberInput"
import { useSettingSite } from "../setting"
import { dataInjection } from "."
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const data = inject(dataInjection)!

        const { data: sites } = useSettingSite()

        const rules = computed(() => (data.value?.sourceAnalyseRules.map((rule, index) => ({name: generateRuleName(rule), value: `_${index}`})) ?? []).concat([{name: "新建规则…", value: "CREATE"}]))
        const selected = ref<string>()
        const selectedIdx = ref<number>()
        const select = (v: string) => {
            if(v.startsWith("_")) {
                selectedIdx.value = parseInt(v.substr(1))
            }else if(v === "CREATE") {
                selectedIdx.value = undefined
            }
            selected.value = v
        }
        const updateSelectedIdx = (v: number | undefined) => {
            if(v !== undefined) {
                selectedIdx.value = v
                selected.value = `_${v}`
            }else{
                selectedIdx.value = undefined
                selected.value = undefined
            }
        }

        return () => <div class="mt-2">
            <label class="label">来源解析规则</label>
            <div class={style.sourceAnalyseRuleBoard}>
                <div class={style.left}>
                    <SelectList class="h-100" items={rules.value} value={selected.value} onUpdateValue={select} allowCancel={false}/>
                </div>
                <div class={style.right}>
                    {selected.value && <RuleEditor siteList={sites.value} ruleIdx={selectedIdx.value} onUpdateRuleIdx={updateSelectedIdx}/>}
                </div>
            </div>
        </div>
    }
})

const RuleEditor = defineComponent({
    props: {
        siteList: {type: null as any as PropType<Site[]>, required: true},
        ruleIdx: Number
    },
    emits: ["updateRuleIdx"],
    setup(props, { emit }) {
        const messageBox = useMessageBox()
        const data = inject(dataInjection)!

        const siteList = computed(() => props.siteList.map(site => ({name: site.title, value: site.name})))

        const move = (fromIdx: number, strategy: "first" | "prev" | "next" | "last") => {
            const rules = data.value!.sourceAnalyseRules
            if(strategy === "first") {
                data.value!.sourceAnalyseRules = [rules[fromIdx], ...rules.slice(0, fromIdx), ...rules.slice(fromIdx + 1)]
                emit("updateRuleIdx", 0)
            }else if(strategy === "prev") {
                data.value!.sourceAnalyseRules = [...rules.slice(0, fromIdx - 1), rules[fromIdx], rules[fromIdx - 1], ...rules.slice(fromIdx + 1)]
                emit("updateRuleIdx", fromIdx - 1)
            }else if(strategy === "next") {
                data.value!.sourceAnalyseRules = [...rules.slice(0, fromIdx), rules[fromIdx + 1], rules[fromIdx], ...rules.slice(fromIdx + 2)]
                emit("updateRuleIdx", fromIdx + 1)
            }else{
                data.value!.sourceAnalyseRules = [...rules.slice(0, fromIdx), ...rules.slice(fromIdx + 1), rules[fromIdx]]
                emit("updateRuleIdx", data.value!.sourceAnalyseRules.length - 1)
            }
        }
        const sortMenu = useElementPopupMenu(() => {
            const idx = props.ruleIdx
            if(idx !== undefined) {
                const canPrev = idx > 0, canNext = idx < data.value!.sourceAnalyseRules.length - 1
                return [
                    {type: "normal", label: "移到最前", enabled: canPrev, click() { move(idx, "first") }},
                    {type: "normal", label: "上移一位", enabled: canPrev, click() { move(idx, "prev") }},
                    {type: "normal", label: "下移一位", enabled: canNext, click() { move(idx, "next") }},
                    {type: "normal", label: "移到最后", enabled: canNext, click() { move(idx, "last") }}
                ]
            }else return []
        })

        const rule = ref<SourceAnalyseRule>(generateRule())
        watch(() => [props.ruleIdx, data.value?.sourceAnalyseRules], () => rule.value = generateRule(), {immediate: true})
        function generateRule(): SourceAnalyseRule {
            if(props.ruleIdx !== undefined) {
                const rule = data.value!.sourceAnalyseRules[props.ruleIdx]
                return {
                    type: rule.type,
                    site: rule.site,
                    regex: rule.regex,
                    idIndex: rule.idIndex,
                    secondaryIdIndex: rule.secondaryIdIndex ?? 0
                }
            }else{
                return {
                    type: "name",
                    site: props.siteList[0].name,
                    regex: "",
                    idIndex: 0,
                    secondaryIdIndex: 0
                }
            }
        }

        const needSecondaryId = computed(() => props.siteList.find(site => site.name === rule.value.site)?.hasSecondaryId ?? false)

        const create = () => {
            data.value!.sourceAnalyseRules.push({
                type: rule.value.type,
                site: rule.value.site,
                regex: rule.value.regex,
                idIndex: rule.value.idIndex,
                secondaryIdIndex: needSecondaryId.value ? (rule.value.secondaryIdIndex ?? null) : null
            })
            emit("updateRuleIdx", data.value!.sourceAnalyseRules.length - 1)
        }
        const save = () => {
            data.value!.sourceAnalyseRules.splice(props.ruleIdx!, 1, {
                type: rule.value.type,
                site: rule.value.site,
                regex: rule.value.regex,
                idIndex: rule.value.idIndex,
                secondaryIdIndex: needSecondaryId.value ? (rule.value.secondaryIdIndex ?? null) : null
            })
        }
        const remove = async () => {
            if(await messageBox.showYesNoMessage("提示", "确定要删除这条规则吗？")) {
                data.value!.sourceAnalyseRules.splice(props.ruleIdx!, 1)
                emit("updateRuleIdx", undefined)
            }
        }

        return () => <div class="block h-100">
            <div>
                <label class="label">对应站点</label>
                <Select items={siteList.value} value={rule.value.site} onUpdateValue={v => rule.value.site = v}/>
            </div>
            <div class="mt-2">
                <label class="label">规则类型</label>
                <Select items={ruleTypes} value={rule.value.type} onUpdateValue={v => rule.value.type = v}/>
                <p class="is-size-8 has-text-grey">{ruleIntroduction["name"]}</p>
            </div>
            <div class="mt-2">
                <label class="label">正则表达式</label>
                <Input class="is-fullwidth" value={rule.value.regex} onUpdateValue={v => rule.value.regex = v}/>
            </div>
            <div class="mt-2">
                <div class={style.inlineDiv}>
                    <label class="label">ID生成位置</label>
                    <NumberInput class="is-width-one-third mx-1" min={0} value={rule.value.idIndex} onUpdateValue={v => rule.value.idIndex = v}/>
                </div>
                {needSecondaryId.value && <div class={style.inlineDiv}>
                    <label class="label">次级ID生成位置</label>
                    <NumberInput class="is-width-one-third mx-1" min={0} value={rule.value.secondaryIdIndex!} onUpdateValue={v => rule.value.secondaryIdIndex = v}/>
                </div>}
            </div>
            <div class="group mt-5">
                {props.ruleIdx !== undefined ? <>
                    <button class="button is-small is-info" onClick={save}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
                    <button class="square button is-small is-white" ref={sortMenu.element} onClick={sortMenu.popup}><span class="icon"><i class="fa fa-sort-amount-down"/></span></button>
                    <button class="square button is-small is-danger float-right" onClick={remove}><span class="icon"><i class="fa fa-trash"/></span></button>
                </> : <>
                    <button class="button is-small is-success" onClick={create}><span class="icon"><i class="fa fa-plus"/></span><span>添加规则</span></button>
                </>}
            </div>
        </div>
    }
})

function generateRuleName(rule: SourceAnalyseRule): string {
    return `[${rule.type}] ${rule.regex}`
}

const ruleTypes = [
    {value: "name", name: "按文件名"},
    {value: "from-meta", name: "按文件元数据:下载来源"},
    {value: "system-history", name: "从系统下载历史搜索"}
]

const ruleIntroduction = {
    ["name"]: "使用正则表达式匹配文件名不包含扩展名的部分。",
    ["from-meta"]: "尝试使用正则表达式匹配文件元数据中\"下载来源\"URL。",
    ["system-history"]: "在系统的下载历史数据库中，尝试按文件名搜索下载项，随后尝试使用正则表达式匹配此文件的源URL。"
}