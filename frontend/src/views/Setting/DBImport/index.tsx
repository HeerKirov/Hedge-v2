import { defineComponent, inject, InjectionKey, provide, Ref, ref } from "vue"
import { ImportOption, TimeType } from "@/functions/adapter-http/impl/setting-import"
import { usePropertySot } from "@/functions/utils/properties/setter-property"
import CheckBox from "@/components/forms/CheckBox"
import NumberInput from "@/components/forms/NumberInput"
import Select from "@/components/forms/Select"
import SourceAnalyseRuleBoard from "./SourceAnalyseRuleBoard"
import { useSettingImport } from "@/functions/api/setting"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingImport()

        provide(dataInjection, data)

        return () => loading.value ? <div/> : <div>
            <p class="mb-3 is-size-medium">导入选项</p>
            <AutoOptionsBoard/>
            <TimeTypeBoard/>
            <PartitionTimeDelayBoard/>
            <SourceAnalyseRuleBoard/>
        </div>
    }
})

const timeTypes: {value: TimeType, name: string}[] = [
    {value: "IMPORT_TIME", name: "项目导入时间"},
    {value: "CREATE_TIME", name: "文件创建时间"},
    {value: "UPDATE_TIME", name: "文件修改时间"}
]

export const dataInjection: InjectionKey<Ref<ImportOption | undefined>> = Symbol()

const AutoOptionsBoard = defineComponent({
    setup() {
        const data = inject(dataInjection)!

        return () => <>
            <div class="mt-2">
                <CheckBox value={data.value!.autoAnalyseMeta} onUpdateValue={v => data.value!.autoAnalyseMeta = v}>自动分析</CheckBox>
                <p class="is-size-7 has-text-grey">导入文件时，自动执行分析操作，分析导入项目的来源。</p>
            </div>
            <div class="mt-2">
                <CheckBox value={data.value!.setTagmeOfTag} onUpdateValue={v => data.value!.setTagmeOfTag = v}>自动设定Tagme:标签</CheckBox>
                <p class="is-size-7 has-text-grey">导入文件时，自动将导入项目的Tagme标记为标签、主题和作者。</p>
            </div>
            <div class="mt-2">
                <CheckBox value={data.value!.setTagmeOfSource} onUpdateValue={v => data.value!.setTagmeOfSource = v}>自动设定Tagme:来源</CheckBox>
                <p class="is-size-7 has-text-grey">导入文件时，自动将导入项目的Tagme标记为来源。不过，如果项目的来源可以被分析，则不会设定。</p>
            </div>
        </>
    }
})

const TimeTypeBoard = defineComponent({
    setup() {
        const data = inject(dataInjection)!

        return () => <div class="mt-2">
            <label class="label">排序时间方案</label>
            <div class="group mt-1">
                <Select items={timeTypes} value={data.value!.setTimeBy} onUpdateValue={(v: TimeType) => data.value!.setTimeBy = v}/>
            </div>
            <p class="is-size-7 has-text-grey">使用选定的属性作为导入项目的排序时间。当选定的属性不存在时，自动选择其他属性。</p>
        </div>
    }
})

const PartitionTimeDelayBoard = defineComponent({
    setup() {
        const data = inject(dataInjection)!

        const [partitionTimeDelay, partitionTimeDelaySot, setPartitionTimeDelay, savePartitionTimeDelay] = usePropertySot(ref((data.value?.setPartitionTimeDelay ?? 0) / (1000 * 60 * 60)),
            () => data.value?.setPartitionTimeDelay,
            () => data.value != null ? (data.value?.setPartitionTimeDelay ?? 0) / (1000 * 60 * 60) : undefined,
            v => data.value!.setPartitionTimeDelay = v * 1000 * 60 * 60)

        return () => <div class="mt-2">
            <label class="label">分区判定时延</label>
            <div class="group mt-1">
                <NumberInput min={-23} max={23} value={partitionTimeDelay.value} onUpdateValue={setPartitionTimeDelay}/><span class="mr-2">小时</span>
                {partitionTimeDelaySot.value && <button class="square button is-info" onClick={savePartitionTimeDelay}><span class="icon"><i class="fa fa-save"/></span></button>}
            </div>
            <p class="is-size-7 has-text-grey">从创建时间生成分区时间时，会将0点以后延迟一定时间内的时间点仍然视作前一天。</p>
        </div>
    }
})
