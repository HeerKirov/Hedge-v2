import { computed, defineComponent, PropType } from "vue"
import WrappedText from "@/components/elements/WrappedText"
import Starlight from "@/components/elements/Starlight"
import { TagmeInfo } from "@/layouts/display-components"
import {
    DateEditor, DateTimeEditor,
    DescriptionEditor, StarlightEditor,
    ViewAndEditor, ViewAndEditable
} from "@/layouts/editor-components"
import { SimpleAuthor } from "@/functions/adapter-http/impl/author"
import { SimpleTopic } from "@/functions/adapter-http/impl/topic"
import { SimpleTag } from "@/functions/adapter-http/impl/tag"
import { usePopupMenu } from "@/functions/module"
import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import { useDetailViewContext, useMetadataEndpoint } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { detail: { target }, ui: { drawerTab } } = useDetailViewContext()
        const { data, setData } = useMetadataEndpoint()

        const setDescription = async (description: string) => {
            return description === data.value?.description || await setData({ description })
        }
        const setScore = async (score: number | null) => {
            return score === data.value?.score || await setData({ score })
        }
        const setPartitionTime = async (partitionTime: LocalDateTime) => {
            return partitionTime.timestamp === data.value?.partitionTime?.timestamp || await setData({partitionTime})
        }
        const setOrderTime = async ([orderTime]: [LocalDateTime, LocalDateTime, LocalDateTime]) => {
            return orderTime.timestamp === data.value?.orderTime?.timestamp || await setData({orderTime})
        }

        const openMetaTagEditor = () => drawerTab.value = drawerTab.value !== "metaTag" ? "metaTag" : undefined

        return () => <div class={style.detailInfoPanel}>
            <p><i class="fa fa-id-card mr-2"/><b class="can-be-selected">{target.value?.id}</b></p>
            {data.value && <>
                <ViewAndEditor class="mt-2" data={data.value.description} onSetData={setDescription} showSaveButton={false} v-slots={{
                    default: ({ value }) => <DescriptionDisplay value={value}/>,
                    editor: ({ value, setValue, save }) => <DescriptionEditor value={value} onUpdateValue={setValue} onSave={save} showSaveButton={true}/>
                }}/>
                <ViewAndEditor class="mt-2" data={data.value.score} onSetData={setScore} baseline="medium" v-slots={{
                    default: ({ value }) => <StarlightDisplay class="pt-1" value={value}/>,
                    editor: ({ value, setValue }) => <StarlightEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditable class="mt-3" onEdit={openMetaTagEditor}>
                    {data.value.tagme.length > 0 && <TagmeInfo class="is-white" value={data.value.tagme}/>}
                    <MetaTagDisplay authors={data.value.authors} topics={data.value.topics} tags={data.value.tags}/>
                </ViewAndEditable>
                <ViewAndEditor class="mt-2" data={data.value.partitionTime} onSetData={setPartitionTime} baseline="medium" v-slots={{
                    default: ({ value }) => <PartitionTimeDisplay partitionTime={value}/>,
                    editor: ({ value, setValue }) => <DateEditor value={value} onUpdateValue={setValue}/>
                }}/>
                <ViewAndEditor class="mt-1" data={[data.value.orderTime, data.value.createTime, data.value.updateTime]} onSetData={setOrderTime} baseline="medium" v-slots={{
                    default: ({ value: [orderTime, createTime, updateTime] }) => <TimeDisplay orderTime={orderTime} createTime={createTime} updateTime={updateTime}/>,
                    editor: ({ value: [orderTime, c, u], setValue }) => <DateTimeEditor value={orderTime} onUpdateValue={v => setValue([v, c, u])}/>
                }}/>
            </>}
        </div>
    }
})

function DescriptionDisplay(props: {value: string}) {
    return props.value ? <WrappedText value={props.value}/> : <i class="has-text-grey">没有描述</i>
}

function StarlightDisplay(props: {value: number | null}) {
    return props.value !== null
        ? <Starlight value={props.value} showText={true}/>
        : <div class="has-text-grey"><i class="fa fa-star-half"/><i>评分空缺</i></div>
}

function TimeDisplay(props: {orderTime: LocalDateTime, createTime: LocalDateTime, updateTime: LocalDateTime}) {
    return <div class="pt-1">
        <p class="has-text-grey">排序时间 {datetime.toSimpleFormat(props.orderTime)}</p>
        <p class="has-text-grey">添加时间 {datetime.toSimpleFormat(props.createTime)}</p>
        {props.updateTime.timestamp !== props.updateTime.timestamp && <p class="has-text-grey">上次修改 {datetime.toSimpleFormat(props.updateTime)}</p>}
    </div>
}

const PartitionTimeDisplay = defineComponent({
    props: {
        partitionTime: {type: null as any as PropType<LocalDate>, required: true}
    },
    setup(props) {
        const text = computed(() => date.toISOString(props.partitionTime))

        //TODO 完成orderTime popup menu的功能
        const menu = usePopupMenu([
            {type: "normal", "label": `查看时间分区`},
            {type: "normal", "label": `在新窗口中打开时间分区`}
        ])

        return () => <p class="pt-1 has-text-grey" onContextmenu={() => menu.popup()}>时间分区 {text.value}</p>
    }
})

const MetaTagDisplay = defineComponent({
    props: {
        authors: {type: Array as PropType<SimpleAuthor[]>, required: true},
        topics: {type: Array as PropType<SimpleTopic[]>, required: true},
        tags: {type: Array as PropType<SimpleTag[]>, required: true},
    },
    setup(props) {
        //TODO 完成tag popup menu的功能
        const menu = usePopupMenu([
            {type: "normal", "label": "查看标签详情页"},
            {type: "normal", "label": "在新窗口中打开标签详情页"},
            {type: "separator"},
            {type: "normal", "label": "在图库中搜索"},
            {type: "normal", "label": "在画集中搜索"},
            {type: "normal", "label": "复制此标签的全名"},
        ])

        return () => !props.tags.length && !props.authors.length && !props.topics.length ? <div class="has-text-grey mt-1">
            <i>没有元数据标签</i>
        </div> : <div class={style.metaTag}>
            {props.authors.map(author => <MetaTagDisplayItem value={author} onContextmenu={() => menu.popup()}/>)}
            {props.topics.map(topic => <MetaTagDisplayItem value={topic} onContextmenu={() => menu.popup()}/>)}
            {props.tags.map(tag => <MetaTagDisplayItem value={tag} onContextmenu={() => menu.popup()}/>)}
        </div>
    }
})

function MetaTagDisplayItem({ value }: {value: {name: string, color: string | null}}) {
    return <div><span class={`tag is-${value.color}`}>{value.name}</span></div>
}
