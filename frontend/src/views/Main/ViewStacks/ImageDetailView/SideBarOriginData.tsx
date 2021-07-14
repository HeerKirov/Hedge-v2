import { defineComponent } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import { useOriginDataEndpoint } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const originData = useOriginDataEndpoint()

        return () => <div class={style.originDataPanel}>
            {originData.data.value && (originData.data.value.source !== null && originData.data.value.sourceId !== null ? <>
                <p>
                    <i class="fa fa-pager mr-2"/>
                    <span class="can-be-selected">
                        <span class="mr-1">{originData.data.value.sourceTitle ?? originData.data.value.source}</span>
                        <b>{originData.data.value.sourceId}</b>
                        {originData.data.value.sourcePart !== null && <b class="ml-1">p{originData.data.value.sourcePart}</b>}
                    </span>
                </p>
                <div class="my-2">
                    {originData.data.value.title !== null
                        ? <h1>{originData.data.value.title}</h1>
                        : <i class="has-text-grey">没有标题</i>}
                </div>
                <div class="my-2">
                    {originData.data.value.description !== null
                        ? <WrappedText value={originData.data.value.description}/>
                        : <i class="has-text-grey">没有描述</i>}
                </div>
                <div class="my-2">
                    {originData.data.value.parents.map(parent => <p><i class="fa fa-images mr-2"/>父项 <b>{parent}</b></p>)}
                    {originData.data.value.children.map(child => <p><i class="fa fa-images mr-2"/>子项 <b>{child}</b></p>)}
                </div>
                <div class="my-2">
                    {originData.data.value.pools.map(pool => <p><i class="fa fa-clone mr-2"/>Pool 《<b>{pool}</b>》</p>)}
                </div>
                <div class={[style.sourceTag, "can-be-selected"]}>
                    {originData.data.value.tags.map(tag => <p class={style.tag}>
                        <i class="fa fa-tag mr-2"/>
                        <a><b>{tag.name}</b>{tag.displayName !== null && ` (${tag.displayName})`}</a>
                    </p>)}
                </div>
            </> : <div class={style.noOriginData}>
                <i>没有相关的来源数据</i>
            </div>)}
        </div>
    }
})
