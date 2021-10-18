import { computed, defineComponent, PropType } from "vue"
import { useSettingSite } from "@/functions/api/setting"
import { SourceMappingMetaItem, SourceTag } from "@/functions/adapter-http/impl/source-tag-mapping"

/**
 * 来源信息展示条。显示来源site、id和part。适用于侧边栏。
 * 自动使用{useSettingSite}获取site title。
 */
export const SourceInfo = defineComponent({
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

/**
 * 显示parents, children, pools信息。没有时显示[没有关联项目]。
 */
export function SourceRelationsDisplay({ parents, children, pools }: {parents: number[], children: number[], pools: string[]}) {
    if(parents.length || children.length || pools.length) {
        return <>
            {(parents.length || children.length || null) && <div class="my-2">
                {parents.map(parent => <p><i class="fa fa-images mr-2"/>父项 <b class="can-be-selected">{parent}</b></p>)}
                {children.map(child => <p><i class="fa fa-images mr-2"/>子项 <b class="can-be-selected">{child}</b></p>)}
            </div>}
            {(pools.length || null) && <div class="my-2">
                {pools.map(pool => <p><i class="fa fa-clone mr-2"/>Pool 《<b class="can-be-selected">{pool}</b>》</p>)}
            </div>}
        </>
    }else{
        return <div class="my-2">
            <i class="has-text-grey">没有关联项目</i>
        </div>
    }
}

/**
 * 显示source tags信息。
 */
export function SourceTagListDisplay({ value }: {value: SourceTag[]}) {
    return value.length ? <div class="can-be-selected">
        {value.map(tag => <SourceTagDisplayItem value={tag}/>)}
    </div> : <div>
        <i class="has-text-grey">没有原始标签</i>
    </div>
}

function SourceTagDisplayItem({ value }: {value: SourceTag}) {
    return <p class="mt-half">
        <i class="fa fa-tag mr-2"/>
        <a><b>{value.name}</b>{value.displayName !== null && ` (${value.displayName})`}</a>
    </p>
}

/**
 * 显示source tag mappings信息。
 */
export function SourceTagMappingsDisplay({ value, direction }: {value: SourceMappingMetaItem[], direction: "horizontal" | "vertical"}) {
    return value.length ? <div class="can-be-selected has-text-link">
        {direction === "vertical" ? value.map(tag => <p class="mb-1">
            ·<span class="has-text-grey">[{tag.source}]</span><b>{tag.name}</b>{tag.displayName ? ` (${tag.displayName})` : null}
        </p>) : value.map(tag => <span class="mb-1 mx-1">
            ·<span class="has-text-grey">[{tag.source}]</span><b>{tag.name}</b>{tag.displayName ? ` (${tag.displayName})` : null}
        </span>)}
    </div> : <div>
        <i class="has-text-grey">没有标签映射</i>
    </div>
}
