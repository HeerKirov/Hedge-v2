import { defineComponent, PropType } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import { PaneBasicLayout } from "@/layouts/layouts/SplitPane"
import { useMessageBox } from "@/functions/module"
import { useTagContext } from "./inject"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { DetailTag, IsGroup, TagType, TagUpdateForm } from "@/functions/adapter-http/impl/tag"
import style from "./style.module.scss"
import Starlight from "@/components/elements/Starlight"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { detailMode, closePane } = useTagContext()

        const { data, setData } = useObjectEndpoint<number, DetailTag, TagUpdateForm>({
            path: detailMode,
            get: httpClient => httpClient.tag.get,
            update: httpClient => httpClient.tag.update,
            afterUpdate(id, data) {
                //TODO 更新tag tree中的对应标签的值。为了方便地完成这个更新，需要tag tree在获取时生成索引
            }
        })

        return () => <PaneBasicLayout onClose={closePane} class={style.paneDetailContent}>
            {data.value && <>
                <p class={style.top}/>
                <p class="can-be-selected">{/* TODO 地址段也需要依赖tag tree的生成 */}</p>
                <p class={[style.title, "can-be-selected"]}>
                    <b class={data.value.color ? `has-text-${data.value.color}` : null}>{data.value.name}</b>
                    <i class="has-text-grey">{data.value.otherNames.join(" / ")}</i>
                </p>
                <div class={style.meta}>
                    <TagTypeDisplay value={data.value.type}/>
                    <TagGroupDisplay value={data.value.group}/>
                    {/* TODO group member的信息也需要依赖tag tree生成 */}
                </div>
                <p class={style.separator}/>
                <div class={style.annotations}>
                    {data.value.annotations.map(a => <span key={a.id} class="tag">
                        <b>[</b><span class="mx-1">{a.name}</span><b>]</b>
                    </span>)}
                </div>
                <div class={[style.description, "block"]}>
                    {data.value.description 
                        ? <WrappedText value={data.value.description}/> 
                        : <i class="has-text-grey">没有描述</i>}
                </div>
                <div class={style.links}>
                    {data.value.links.map(link => <p key={link}>
                        <span class="tag">
                            <i class="fa fa-link mr-1"/>
                            <span>链接</span>
                        </span>
                    </p>)}
                </div>
                <div class={style.score}>
                    {data.value.score != null 
                        ? <Starlight showText={true} value={data.value.score}/>
                        : <i class="has-text-grey">暂无评分</i>}
                </div>
                <div class={style.examples}>
                    {data.value.examples.map(example => <div class={style.example}>
                        <img src={`record:///${example.thumbnailFile}`}/>
                    </div>)}
                </div>
            </>}
        </PaneBasicLayout>
    }
})

const TagTypeDisplay = defineComponent({
    props: {
        value: {type: null as any as PropType<TagType>, required: true}
    },
    setup(props) {
        return () => TAG_TYPE_CONTENT[props.value]
    }
})

const TAG_TYPE_CONTENT: {[key in TagType]: JSX.Element} = {
    "TAG": <p><i class="fa fa-tag mr-1"/>标签</p>,
    "ADDR": <p><i class="fa fa-building mr-1"/>地址段</p>,
    "VIRTUAL_ADDR": <p><i class="fa fa-border-style mr-1"/>虚拟地址段</p>,
}

const TagGroupDisplay = defineComponent({
    props: {
        value: {type: null as any as PropType<IsGroup>, required: true}
    },
    setup(props) {
        return () => <p>
            {props.value === "NO" ? TAG_GROUP_CONTENT["NO"] : [
                TAG_GROUP_CONTENT["YES"],
                props.value === "SEQUENCE" || props.value === "FORCE_AND_SEQUENCE" ? TAG_GROUP_CONTENT["SEQUENCE"] : null,
                props.value === "FORCE" || props.value === "FORCE_AND_SEQUENCE" ? TAG_GROUP_CONTENT["FORCE"] : null
            ]}
        </p>
    }
})

const TAG_GROUP_CONTENT: {[key in Exclude<IsGroup, "FORCE_AND_SEQUENCE">]: JSX.Element} = {
    "NO": <><i class="fa fa-object-group mr-1 has-text-grey"/><span class="mr-3 has-text-grey">非组</span></>,
    "YES": <><i class="fa fa-object-group mr-1"/><span class="mr-3">组</span></>,
    "SEQUENCE": <><i class="fa fa-sort-alpha-down mr-1"/><span class="mr-3">序列化</span></>,
    "FORCE": <><b class="mr-1">!</b><span class="mr-3">强制唯一</span></>
}

const TagGroupMemberDisplay = defineComponent({
    setup() {
        return () => <p/>
    }
})