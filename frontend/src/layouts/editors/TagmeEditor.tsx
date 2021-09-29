import { defineComponent, PropType } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { Tagme } from "@/functions/adapter-http/impl/illust"

export default defineComponent({
    props: {
        value: Array as any as PropType<Tagme[]>
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const onSetValue = (tagme: Tagme) => (v: boolean) => {
            if(v) {
                emit("updateValue", [...(props.value ?? []), tagme])
            }else{
                const value = props.value ?? []
                const i = value.indexOf(tagme)
                emit("updateValue", [...value.slice(0, i), ...value.slice(i + 1)])
            }
        }

        return () => <div>
            <p class="has-text-grey mb-1">Tagme</p>
            {TAGME_LIST.map(tagme => <p key={tagme}>
                <CheckBox value={props.value?.includes(tagme)} onUpdateValue={onSetValue(tagme)}>
                    {ICONS[tagme]}
                    {NAMES[tagme]}
                </CheckBox>
            </p>)}
        </div>
    }
})

const TAGME_LIST: Tagme[] = ["TAG", "AUTHOR", "TOPIC", "SOURCE"]

const ICONS: {[tagme in Tagme]: JSX.Element} = {
    "TAG": <i class="fa fa-tag ml-1"/>,
    "AUTHOR": <i class="fa fa-user-tag ml-1"/>,
    "TOPIC": <i class="fa fa-hashtag ml-1"/>,
    "SOURCE": <i class="fa fa-pager ml-1"/>
}

const NAMES: {[tagme in Tagme]: string} = {
    "TAG": "标签",
    "AUTHOR": "作者",
    "TOPIC": "主题",
    "SOURCE": "来源信息"
}
