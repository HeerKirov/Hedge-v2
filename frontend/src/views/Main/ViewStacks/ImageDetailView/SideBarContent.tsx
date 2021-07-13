import { defineComponent, PropType, ref, toRef } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import { TagmeInfo } from "@/layouts/display-components"
import { SideBar } from "@/layouts/layouts/SideLayout"
import { assetsUrl } from "@/functions/app"
import { date, datetime } from "@/utils/datetime"
import { useDetailViewContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const tab = ref<TabType>("origin")
        const updateTab = (v: TabType) => tab.value = v

        const sideBarSlots = {
            default() {
                const Panel = tab.value === "info" ? DetailInfoPanel :
                    tab.value === "origin" ? OriginDataPanel :
                        tab.value === "related" ? RelatedItemsPanel :
                            FileInfoPanel
                return <Panel/>
            },
            bottom() { return <BottomButtons tab={tab.value} onTab={updateTab}/> }
        }
        return () => <SideBar v-slots={sideBarSlots}/>
    }
})

type TabType = "info" | "origin" | "related" | "file"

const TAB_BUTTONS: {key: TabType, title: string, icon: string}[] = [
    {key: "info", title: "项目信息", icon: "info"},
    {key: "file", title: "文件信息", icon: "file-image"},
    {key: "origin", title: "来源数据", icon: "file-invoice"},
    {key: "related", title: "相关项目", icon: "dice-d6"},
]

const BottomButtons = defineComponent({
    props: {
        tab: {type: String as PropType<TabType>, required: true}
    },
    emits: ["tab"],
    setup(props, { emit }) {
        const tab = toRef(props, "tab")

        const onTab = (type: TabType) => () => emit("tab", type)

        return () => <div>
            {TAB_BUTTONS.map(item => <button class="button is-sidebar radius-large mr-1" onClick={onTab(item.key)}>
                <span class="idp-icon"><i class={`fa fa-${item.icon}`}/></span>{item.key === tab.value && <span class="ml-1">{item.title}</span>}
            </button>)}
        </div>
    }
})

const DetailInfoPanel = defineComponent({
    setup() {
        const { detail: { target, metadata } } = useDetailViewContext()

        return () => <div class={style.detailInfoPanel}>
            <p><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{target.value?.id}</b></p>
            {metadata.data.value && <>
                <div class={style.description}>
                    {metadata.data.value.description
                        ? <WrappedText value={metadata.data.value.description}/>
                        : <i class="has-text-grey">没有描述</i>}
                </div>
                <div class={style.score}>
                    {metadata.data.value.score !== null
                        ? <Starlight value={metadata.data.value.score} showText={true}/>
                        : <div class="has-text-grey"><i class="fa fa-star-half"/><i>评分空缺</i></div>}
                </div>
                <TagmeInfo class="is-white" value={metadata.data.value.tagme}/>
                <div class={style.metaTag}>
                    {metadata.data.value.authors.map(author => <div><span class={`tag is-${author.color}`}>{author.name}</span></div>)}
                    {metadata.data.value.topics.map(topic => <div><span class={`tag is-${topic.color}`}>{topic.name}</span></div>)}
                    {metadata.data.value.tags.map(tags => <div><span class={`tag is-${tags.color}`}>{tags.name}</span></div>)}
                </div>
                <p class="mt-2 has-text-grey">时间分区 {date.toISOString(metadata.data.value.partitionTime)}</p>
                <p class="has-text-grey">排序时间 {datetime.toSimpleFormat(metadata.data.value.orderTime)}</p>
                <p class="has-text-grey">添加时间 {datetime.toSimpleFormat(metadata.data.value.createTime)}</p>
                <p class="has-text-grey">上次更改 {datetime.toSimpleFormat(metadata.data.value.updateTime)}</p>
            </>}
        </div>
    }
})

const FileInfoPanel = defineComponent({
    setup() {
        const { detail: { target } } = useDetailViewContext()

        return () => <div class={style.fileInfoPanel}>
            {target.value !== null && <div class={style.thumbnail}>
                <img src={assetsUrl(target.value.thumbnailFile)} alt="thumbnail image"/>
            </div>}
        </div>
    }
})

const OriginDataPanel = defineComponent({
    setup() {
        const { detail: { originData } } = useDetailViewContext()

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
                <i>无关联的来源项目</i>
            </div>)}
        </div>
    }
})

const RelatedItemsPanel = defineComponent({
    setup() {
        const { detail: { relatedItems } } = useDetailViewContext()

        return () => <div class={style.relatedItemsPanel}>
            {relatedItems.data.value && <>
                {relatedItems.data.value.albums.length > 0 && <div class={style.albums}>
                    <b>所属画集</b>
                    {relatedItems.data.value.albums.map(album => <div class={style.album}><a>《{album.title}》</a></div>)}
                </div>}
                {relatedItems.data.value.collection !== null && <div class={style.collection}>
                    <b>所属集合</b>
                    <div class={style.image}>
                        <img src={assetsUrl(relatedItems.data.value.collection.thumbnailFile)} alt="related collection"/>
                        <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{relatedItems.data.value.collection.childrenCount}</span>
                    </div>
                </div>}
                {relatedItems.data.value.associate !== null && <div class={style.associate}>
                    <b>关联组</b>
                    <div class={style.images}>
                        {relatedItems.data.value.associate.items.map(item => <div class={style.image}>
                            <img src={assetsUrl(item.thumbnailFile)} alt="associate item"/>
                        </div>)}
                    </div>
                    <p class={style.more}><a>查看关联组的全部项目<i class="fa fa-angle-double-right ml-1"/></a></p>
                </div>}
                {relatedItems.data.value.albums.length === 0 && relatedItems.data.value.collection === null && relatedItems.data.value.associate === null && <div class={style.noAnyRelated}>
                    <i>无任何相关项目数据</i>
                </div>}
            </>}
        </div>
    }
})
