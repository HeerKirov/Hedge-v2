import { defineComponent } from "vue"
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
import { date, datetime, LocalDateTime } from "@/utils/datetime"
import { useDetailViewContext, useMetadataEndpoint } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { detail: { target } } = useDetailViewContext()
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
                <ViewAndEditable class="mt-3">
                    {data.value.tagme.length > 0 && <TagmeInfo class="is-white" value={data.value.tagme}/>}
                    <MetaTagDisplay authors={data.value.authors} topics={data.value.topics} tags={data.value.tags}/>
                </ViewAndEditable>
                <ViewAndEditor class="mt-2" data={data.value.partitionTime} onSetData={setPartitionTime} baseline="medium" v-slots={{
                    default: ({ value }) => <p class="pt-1 has-text-grey">时间分区 {date.toISOString(value)}</p>,
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

function MetaTagDisplay(props: {authors: SimpleAuthor[], topics: SimpleTopic[], tags: SimpleTag[]}) {
    return !props.tags.length && !props.authors.length && !props.topics.length ? <div class="has-text-grey mt-1">
        <i>没有元数据标签</i>
    </div> : <div class={style.metaTag}>
        {props.authors.map(author => <div><span class={`tag is-${author.color}`}>{author.name}</span></div>)}
        {props.topics.map(topic => <div><span class={`tag is-${topic.color}`}>{topic.name}</span></div>)}
        {props.tags.map(tags => <div><span class={`tag is-${tags.color}`}>{tags.name}</span></div>)}
    </div>
}
