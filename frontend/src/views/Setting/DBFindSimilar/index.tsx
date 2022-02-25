import { defineComponent, PropType } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { TaskConfig } from "@/functions/adapter-http/impl/find-similar"
import { useSettingFindSimilar } from "@/services/api/setting"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingFindSimilar()

        return () => loading.value ? <div/> : <div>
            <p class="mb-3 is-size-medium">相似项查找选项</p>
            <TaskConfigEditor class="mt-2" value={data.value!.defaultTaskConf} onUpdateValue={v => data.value!.defaultTaskConf = v}/>
            <div class="mt-6">
                <CheckBox value={data.value!.autoFindSimilar} onUpdateValue={v => data.value!.autoFindSimilar = v}>自动执行相似项查找</CheckBox>
                <p class="is-size-8 has-text-grey">导入项目时，自动对新导入的项目执行相似项查找。查找使用默认查找选项，或使用下面的自动查找选项覆盖。</p>
                {data.value!.autoFindSimilar && <CheckBox class="mt-1" value={data.value!.autoTaskConf != null} onUpdateValue={v => data.value!.autoTaskConf = v ? data.value!.defaultTaskConf : null}>使用单独的查找选项</CheckBox>}
            </div>
            {data.value!.autoFindSimilar && data.value!.autoTaskConf && <TaskConfigEditor class="mt-2 pl-4" value={data.value!.autoTaskConf} onUpdateValue={v => data.value!.autoTaskConf = v}/>}

        </div>
    }
})

const TaskConfigEditor = defineComponent({
    props: {
        value: {type: Object as PropType<TaskConfig>, required: true}
    },
    emits: {
        updateValue: (_: TaskConfig) => true
    },
    setup(props, { emit }) {
        function setValue<K extends keyof TaskConfig>(key: K) {
            return function (value: TaskConfig[K]) {
                emit("updateValue", {...props.value, [key]: value})
            }
        }

        return () => <div>
            <label class="label">选用查找方案</label>
            <p class="mt-1">
                <CheckBox value={props.value.findBySourceKey} onUpdateValue={setValue("findBySourceKey")}>来源重复</CheckBox>
                <p class="is-size-8 has-text-grey">对于拥有完全相同的来源、来源ID、分P的图像，直接将其判定为相同项。</p>
            </p>
            <p class="mt-1">
                <CheckBox value={props.value.findBySimilarity} onUpdateValue={setValue("findBySimilarity")}>内容相似度判断</CheckBox>
                <p class="is-size-8 has-text-grey">计算图像的特征指纹，比对出内容高度相似以及雷同的图像。</p>
            </p>
            <p class="mt-1">
                <CheckBox value={props.value.findBySourceRelation} onUpdateValue={setValue("findBySourceRelation")}>来源关系判断</CheckBox>
                <p class="is-size-8 has-text-grey">根据来源的关联项、集合、分P等属性，查找出在来源具有血缘关系的图像。</p>
            </p>
            <p class="mt-1">
                <CheckBox value={props.value.findBySourceMark} onUpdateValue={setValue("findBySourceMark")}>来源标记</CheckBox>
                <p class="is-size-8 has-text-grey">扩展功能：根据外来添加的标记获知图像之间的血缘关系。</p>
            </p>
            <label class="label mt-3">相似项查找范围</label>
            <p class="is-size-8 has-text-grey">对于每一个待处理的任务项，按照下列可选范围查找可能的相似项。</p>
            <p class="mt-1"><CheckBox value={props.value.filterByPartition} onUpdateValue={setValue("filterByPartition")}>相同时间分区</CheckBox></p>
            <p class="mt-1"><CheckBox value={props.value.filterByAuthor} onUpdateValue={setValue("filterByAuthor")}>相同作者标签</CheckBox></p>
            <p class="mt-1"><CheckBox value={props.value.filterByTopic} onUpdateValue={setValue("filterByTopic")}>相同主题标签</CheckBox></p>
        </div>
    }
})
