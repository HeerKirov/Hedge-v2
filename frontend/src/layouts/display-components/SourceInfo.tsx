import { computed, defineComponent, PropType } from "vue"
import { useSettingSite } from "@/functions/api/setting"

/**
 * 来源信息展示条。显示来源site、id和part。适用于侧边栏。
 * 自动使用{useSettingSite}获取site title。
 */
export default defineComponent({
    props: {
        source: null as any as PropType<string | null>,
        sourceId: null as any as PropType<number | null>,
        sourcePart: null as any as PropType<number | null>
    },
    setup(props) {
        const { data: siteList } = useSettingSite()

        const site = computed(() => props.source != null ? siteList.value.find(s => s.name === props.source) ?? null : null)

        const sourceTitle = computed(() => site?.value?.title ?? props.source)

        return () => props.source ? <p>
            <i class="fa fa-pager mr-2"/>
            <span class="can-be-selected">
                <span class="mr-1">{sourceTitle.value}</span>
                <b class="mr-1">{props.sourceId}</b>
                {props.sourcePart != null ? <b>p{props.sourcePart}</b> : undefined}
            </span>
        </p> : <p class="has-text-grey">
            <i class="fa fa-pager mr-2"/>
            无来源信息
        </p>
    }
})
