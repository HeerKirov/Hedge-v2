import { defineComponent, PropType } from "vue"

export default defineComponent({
    props: {
        source: null as any as PropType<string | null>,
        sourceId: null as any as PropType<number | null>,
        sourcePart: null as any as PropType<number | null>
    },
    setup(props) {
        return () => props.source ? <p>
            <i class="fa fa-pager mr-2"/>
            <span class="can-be-selected">
                <span class="mr-1">{props.source}</span>
                <b class="mr-1">{props.sourceId}</b>
                {props.sourcePart != null ? <b>p{props.sourcePart}</b> : undefined}
            </span>
        </p> : <p class="has-text-grey">
            <i class="fa fa-pager mr-2"/>
            无来源信息
        </p>
    }
})
