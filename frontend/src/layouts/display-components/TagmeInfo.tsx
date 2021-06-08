import { defineComponent, PropType } from "vue"
import { Tagme } from "@/functions/adapter-http/impl/illust"

export default defineComponent({
    props: {
        value: null as any as PropType<Tagme[]>
    },
    setup(props) {
        const tagmeList: Tagme[] = ["TAG", "AUTHOR", "TOPIC", "SOURCE"]

        return () => <span class="tag">
            <span>Tagme</span>
            {tagmeList.filter(tagme => props.value?.includes(tagme)).map(tagme => ICONS[tagme])}
        </span>
    }
})

const ICONS: {[tagme in Tagme]: JSX.Element} = {
    "TAG": <i class="fa fa-tag ml-1"/>,
    "AUTHOR": <i class="fa fa-user-tag ml-1"/>,
    "TOPIC": <i class="fa fa-hashtag ml-1"/>,
    "SOURCE": <i class="fa fa-pager ml-1"/>
}
