import { computed, defineComponent, PropType, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import CheckBox from "@/components/forms/CheckBox"
import StdColorSelector from "@/components/forms/StdColorSelector"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { useSettingMeta } from "@/services/api/setting"
import { arrays } from "@/utils/collections"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingMeta()

        const updateScore = (descriptions: {word: string, content: string}[]) => {
            data.value! = {
                ...data.value!,
                scoreDescriptions: descriptions
            }
        }

        return () => loading.value ? <div/> : <div>
            <p class="mb-1 is-size-medium">元数据选项</p>
            <label class="label mt-2">标签颜色</label>
            <MetaColorBoard topicColors={data.value!.topicColors} authorColors={data.value!.authorColors} onUpdateTopic={v => data.value!.topicColors = v} onUpdateAuthor={v => data.value!.authorColors = v}/>
            <label class="label mt-2">评分描述</label>
            <ScoreBoard descriptions={data.value!.scoreDescriptions} onUpdate={updateScore}/>
            <label class="label mt-2">Tagme</label>
            <div class="mt-2">
                <CheckBox value={data.value!.autoCleanTagme} onUpdateValue={v => data.value!.autoCleanTagme = v}>自动清理Tagme</CheckBox>
                <p class="is-size-7 has-text-grey">对项目做更改时，如果Tagme标记的部分发生变化，自动去除这部分Tagme标记。</p>
            </div>
        </div>
    }
})

const MetaColorBoard = defineComponent({
    props: {
        topicColors: {type: Object as PropType<{[key in TopicType]: string}>, required: true},
        authorColors: {type: Object as PropType<{[key in AuthorType]: string}>, required: true}
    },
    emits: ["updateTopic", "updateAuthor"],
    setup(props, { emit }) {

        const onSetTopic = (t: TopicType) => (v: string) => {
            emit("updateTopic", {...props.topicColors, [t]: v})
        }

        const onSetAuthor = (t: AuthorType) => (v: string) => {
            emit("updateAuthor", {...props.authorColors, [t]: v})
        }

        return () => <div>
            <div class="flex is-align-center">
                <label class="mr-4">主题</label>
                {TOPIC_TYPE_ENUMS.map(t => <>
                    <StdColorSelector class="mr-2 is-not-shrink" value={props.topicColors[t]} onUpdateValue={onSetTopic(t)}/>
                    <span class="icon mr-1"><i class={`fa fa-${TOPIC_TYPE_ICONS[t]}`}/></span>
                    <span class="mr-4 is-min-line-width-3">{TOPIC_TYPE_NAMES[t]}</span>
                </>)}
            </div>
            <div class="flex is-align-center mt-1">
                <label class="mr-4">作者</label>
                {AUTHOR_TYPE_ENUMS.map(t => <>
                    <StdColorSelector class="mr-2 is-not-shrink" value={props.authorColors[t]} onUpdateValue={onSetAuthor(t)}/>
                    <span class="icon mr-1"><i class={`fa fa-${AUTHOR_TYPE_ICONS[t]}`}/></span>
                    <span class="mr-4 is-min-line-width-3">{AUTHOR_TYPE_NAMES[t]}</span>
                </>)}
            </div>
        </div>
    }
})

const ScoreBoard = defineComponent({
    props: {
        descriptions: {type: null as any as PropType<{word: string, content: string}[]>, required: true}
    },
    emits: ["update"],
    setup(props, { emit }) {
        const selectListItems = arrays.newArray(10, i => ({value: (10 - i).toString(), name: `${10 - i} 分`}))

        const descriptions = ref<{score: number, word: string, content: string}[]>(mapDescriptionFromData(props.descriptions, 10))

        const selectedScore = ref<number>(10)
        const selectedDescription = computed(() => selectedScore.value ? descriptions.value[selectedScore.value - 1] : undefined)

        const changed = ref(false)
        const changeDescriptionWord = (v: string) => {
            if(selectedScore.value) {
                descriptions.value[selectedScore.value - 1].word = v
                changed.value = true
            }
        }
        const changeDescriptionContent = (v: string) => {
            if(selectedScore.value) {
                descriptions.value[selectedScore.value - 1].content = v
                changed.value = true
            }
        }

        const save = () => {
            if(changed.value) {
                emit("update", descriptions.value.map(({ word, content }) => ({word, content})))
                changed.value = false
            }
        }

        watch(() => props, () => {
            changed.value = false
            descriptions.value = mapDescriptionFromData(props.descriptions, 10)
        })

        return () => <div>
            <div>
                <Select items={selectListItems} value={selectedScore.value?.toString()} onUpdateValue={v => selectedScore.value = parseInt(v)}/>
                {changed.value && <button class="button is-small is-info mt-half ml-2" onClick={save}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>}
            </div>
            <div class="mt-1">
                <Input class="is-small" placeholder="简述" value={selectedDescription.value?.word} onUpdateValue={changeDescriptionWord}/>
                <Input class="is-small ml-1 is-width-2x" placeholder="详述" value={selectedDescription.value?.content} onUpdateValue={changeDescriptionContent}/>
            </div>
        </div>
    }
})

function mapDescriptionFromData(descriptions: {word: string, content: string}[], score: number): {score: number, word: string, content: string}[] {
    if(descriptions.length < score) {
        return descriptions.map((d, i) => ({score: i + 1, ...d})).concat(Array(score - descriptions.length).fill(0).map((_, i) => ({score: i + 1 + descriptions.length, word: "", content: ""})))
    }else{
        return descriptions.slice(0, score).map((d, i) => ({score: i + 1, ...d}))
    }
}

const TOPIC_TYPE_ENUMS: TopicType[] = ["COPYRIGHT", "WORK", "CHARACTER", "UNKNOWN"]

const AUTHOR_TYPE_ENUMS: AuthorType[] = ["ARTIST", "STUDIO", "PUBLISH", "UNKNOWN"]

const TOPIC_TYPE_ICONS: {[key in TopicType]: string} = {
    "COPYRIGHT": "copyright",
    "WORK": "bookmark",
    "CHARACTER": "user-ninja",
    "UNKNOWN": "question"
}

const AUTHOR_TYPE_ICONS: {[key in AuthorType]: string} = {
    "ARTIST": "paint-brush",
    "STUDIO": "swatchbook",
    "PUBLISH": "stamp",
    "UNKNOWN": "question"
}

const TOPIC_TYPE_NAMES: {[key in TopicType]: string} = {
    "COPYRIGHT": "版权方",
    "WORK": "作品",
    "CHARACTER": "角色",
    "UNKNOWN": "未知类型"
}

const AUTHOR_TYPE_NAMES: {[key in AuthorType]: string} = {
    "ARTIST": "画师",
    "STUDIO": "工作室",
    "PUBLISH": "出版物",
    "UNKNOWN": "未知类型"
}
