import { defineComponent, PropType, ref, watch } from "vue"
import { useSettingMeta } from "../setting"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import NumberInput from "@/components/forms/NumberInput"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingMeta()

        const updateScore = (descriptions: {word: string, content: string}[]) => {
            data.value! = {
                scoreDescriptions: descriptions,
                autoCleanTagme: data.value!.autoCleanTagme
            }
        }

        return () => loading.value ? <div/> : <div class={style.root}>
            <p class="mb-1 is-size-medium">元数据选项</p>
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

const ScoreBoard = defineComponent({
    props: {
        descriptions: {type: null as any as PropType<{word: string, content: string}[]>, required: true}
    },
    emits: ["update"],
    setup(props, { emit }) {
        const descriptions = ref<{score: number, word: string, content: string}[]>(mapDescriptionFromData(props.descriptions, 10))

        const changed = ref(false)
        const onChangeDescriptionWord = (index: number) => (v: string) => {
            descriptions.value[index].word = v
            changed.value = true
        }
        const onChangeDescriptionContent = (index: number) => (v: string) => {
            descriptions.value[index].content = v
            changed.value = true
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
            {descriptions.value.map(({ score, word, content }, index) => <div key={score} class={style.scoreDescription}>
                <span class={style.score}>{score}</span>
                <Input class={[style.word, "is-small"]} value={word} onUpdateValue={onChangeDescriptionWord(index)}/>
                <Input class={[style.content, "is-small"]} value={content} onUpdateValue={onChangeDescriptionContent(index)}/>
            </div>)}
            {changed.value && <button class="button is-small is-info mt-1" onClick={save}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>}
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
