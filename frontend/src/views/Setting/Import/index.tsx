import { defineComponent, ref } from "vue"
import { TimeType } from "@/functions/adapter-http/impl/setting-import"
import { useSettingImport } from "@/functions/server-api/setting"
import { usePropertySot } from "@/functions/utils/setter-property"
import Input from "@/components/Input"
import CheckBox from "@/components/CheckBox"
import NumberInput from "@/components/NumberInput"
import Select from "@/components/Select"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingImport()

        const [ partitionTimeDelay, partitionTimeDelaySot, setPartitionTimeDelay, savePartitionTimeDelay] = usePropertySot(ref(0),
            () => data.value?.setPartitionTimeDelay,
            () => data.value != null ? (data.value?.setPartitionTimeDelay ?? 0) / (1000 * 60 * 60) : undefined,
            v => data.value!.setPartitionTimeDelay = v * 1000 * 60 * 60)

        //TODO 完成import analyze rules / system download path
        return () => loading.value ? <div/> : <div>
            <p class="mb-3 is-size-medium">导入选项</p>
            <label class="label">来源解析规则</label>
            <label class="label">自动选项</label>
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
            <div class="mt-2">
                <label class="label">创建时间方案</label>
                <div class="group mt-1">
                    <Select items={timeTypes} value={data.value!.setTimeBy} onUpdateValue={(v: TimeType) => data.value!.setTimeBy = v}/>
                </div>
                <p class="is-size-7 has-text-grey">使用选定的属性作为导入项目的创建时间。当选定的属性不存在时，自动选择其他属性。</p>
            </div>
            <div class="mt-2">
                <label class="label">分区判定时延</label>
                <div class="group mt-1">
                    <NumberInput min={0} max={23} value={partitionTimeDelay.value} onUpdateValue={setPartitionTimeDelay}/><span class="mr-2">小时</span>
                    {partitionTimeDelaySot.value && <button class="square button is-info" onClick={savePartitionTimeDelay}><span class="icon"><i class="fa fa-save"/></span></button>}
                </div>
                <p class="is-size-7 has-text-grey">从创建时间生成分区时间时，会将0点以后延迟一定时间内的时间点仍然视作前一天。</p>
            </div>
            <div class="mt-2">
                <label class="label">系统下载数据库位置</label>
                <div class="group mt-1">
                    <Input class="is-small"/>
                    <button class="button is-small is-info"><span class="icon"><i class="fa fa-folder-open"/></span><span>选择数据库…</span></button>
                    <button class="square button is-small is-info"><span class="icon"><i class="fa fa-save"/></span></button>
                </div>
                <p class="is-size-7 has-text-grey">当使用"从系统下载数据库"分析功能时，所引用的数据库。</p>
            </div>
        </div>
    }
})

const timeTypes: {value: TimeType, name: string}[] = [
    {value: "IMPORT_TIME", name: "项目导入时间"},
    {value: "CREATE_TIME", name: "文件创建时间"},
    {value: "UPDATE_TIME", name: "文件修改时间"}
]