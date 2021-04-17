import { defineComponent, PropType, ref, watch } from "vue"
import { useSettingMeta } from "../setting"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import NumberInput from "@/components/forms/NumberInput"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { loading, data } = useSettingMeta()

        const updateScore = (score: number, descriptions: {word: string, content: string}[]) => {
            data.value! = {
                scoreDescriptions: descriptions,
                scoreMaximum: score,
                autoCleanTagme: data.value!.autoCleanTagme
            }
        }

        return () => loading.value ? <div/> : <div class={style.root}>
            <p class="mb-1 is-size-medium">元数据选项</p>
            <label class="label mt-2">评分</label>
            <ScoreBoard score={data.value!.scoreMaximum} descriptions={data.value!.scoreDescriptions} onUpdate={updateScore}/>
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
        score: {type: Number, required: true},
        descriptions: {type: null as any as PropType<{word: string, content: string}[]>, required: true}
    },
    emits: ["update"],
    setup(props, { emit }) {
        const score = ref(props.score)
        const descriptions = ref<{score: number, word: string, content: string}[]>(mapDescriptionFromData(props.descriptions, props.score))

        const changed = ref(false)
        const changeScore = (v: number) => {
            score.value = v
            changed.value = true
        }
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
                emit("update", score.value, descriptions.value.map(({ word, content }) => ({word, content})))
                changed.value = false
            }
        }

        watch(() => props, () => {
            changed.value = false
            score.value = props.score
            descriptions.value = mapDescriptionFromData(props.descriptions, props.score)
        })
        watch(score, (v, o) => {
            if(v > descriptions.value.length) {
                descriptions.value = [...descriptions.value, {score: v, word: "", content: ""}]
            }else if(v < descriptions.value.length) {
                descriptions.value = descriptions.value.slice(0, v)
            }
        })

        return () => <div class="block">
            <span class="mr-2">评分最大值</span>
            <NumberInput min={1} max={100} value={score.value} onUpdateValue={changeScore}/>
            <p class="is-size-7 has-text-grey">可以调整项目允许的最大评分。允许的最小评分总是1。</p>
            <label class="label mt-2">评分描述</label>
            {descriptions.value.map(({ score, word, content }, index) => <div key={score} class={style.scoreDescription}>
                <span class={style.score}>{score}</span>
                <Input class={style.word} value={word} onUpdateValue={onChangeDescriptionWord(index)}/>
                <Input class={style.content} value={content} onUpdateValue={onChangeDescriptionContent(index)}/>
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
