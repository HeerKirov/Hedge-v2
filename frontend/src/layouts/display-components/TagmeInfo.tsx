import { defineComponent, PropType } from "vue"
import { Tagme } from "@/functions/adapter-http/impl/illust"

export default defineComponent({
    props: {
        value: null as any as PropType<Tagme[]>
    },
    setup(props) {
        return () => {
            const valueList = TAGME_LIST.filter(tagme => props.value?.includes(tagme))
            return <span class="tag">
                <span>Tagme</span>
                {valueList.length ? valueList.map(tagme => ICONS[tagme]) : <i class="ml-1">无</i>}
            </span>
        }
    }
})

const TAGME_LIST: Tagme[] = ["TAG", "AUTHOR", "TOPIC", "SOURCE"]

const ICONS: {[tagme in Tagme]: JSX.Element} = {
    "TAG": <i class="fa fa-tag ml-1"/>,
    "AUTHOR": <i class="fa fa-user-tag ml-1"/>,
    "TOPIC": <i class="fa fa-hashtag ml-1"/>,
    "SOURCE": <i class="fa fa-pager ml-1"/>
}
