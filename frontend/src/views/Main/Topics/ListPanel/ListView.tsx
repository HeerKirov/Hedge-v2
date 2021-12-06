import { computed, defineComponent, PropType, ref, watchEffect } from "vue"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useDraggable } from "@/functions/feature/drag"
import { useMouseHover } from "@/functions/utils/element"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { Topic, TopicType } from "@/functions/adapter-http/impl/topic"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { AnnotationElement } from "@/layouts/elements"
import { arrays } from "@/utils/collections"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "@/definitions/topic"
import { useTopicContext } from "../inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { dataView, detailMode, openDetailPane, closePane, openCreatePane } = useTopicContext()

        const fastEndpoint = useFastObjectEndpoint({
            get: httpClient => httpClient.topic.get,
            update: httpClient => httpClient.topic.update,
            delete: httpClient => httpClient.topic.delete
        })

        const switchFavorite = async (id: number, favorite: boolean) => {
            if(await fastEndpoint.setData(id, {favorite})) {
                const index = dataView.proxy.syncOperations.find(topic => topic.id === id)
                if(index != undefined) {
                    const topic = dataView.proxy.syncOperations.retrieve(index)!
                    dataView.proxy.syncOperations.modify(index, {...topic, favorite})
                }
            }
        }

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(detailMode.value === id) closePane()
                    const index = dataView.proxy.syncOperations.find(topic => topic.id === id)
                    if(index != undefined) dataView.proxy.syncOperations.remove(index)
                }
            }
        }

        const createByItem = async (id: number) => {
            const topic = await fastEndpoint.getData(id)
            if(topic != undefined) {
                openCreatePane({
                    name: topic.name,
                    otherNames: topic.otherNames,
                    type: topic.type,
                    parents: topic.parents,
                    annotations: topic.annotations,
                    keywords: topic.keywords,
                    description: topic.description,
                    favorite: topic.favorite,
                    links: topic.links,
                    score: topic.score
                })
            }
        }

        const createSubOfItem = (id: number) => {
            const index = dataView.proxy.syncOperations.find(t => t.id === id)
            if(index != undefined) {
                const topic = dataView.proxy.syncOperations.retrieve(index)
                if(topic != undefined) {
                    openCreatePane({
                        parents: [{
                            id: topic.id,
                            name: topic.name,
                            type: topic.type,
                            color: topic.color
                        }]
                    })
                }
            }
        }

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "新建子主题", click: createSubOfItem},
            {type: "normal", label: "以此为模板新建", click: createByItem},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={50} padding={{top: 6, bottom: 6, left: 12, right: 12}} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                <table class="table is-fullwidth no-wrap">
                    <tbody>
                        {dataView.data.value.result.map(item => <Item key={item.id} value={item}
                                                                          selected={detailMode.value === item.id}
                                                                          onRightClick={() => popupmenu.popup(item.id)}
                                                                          onSwitchFavorite={(v: boolean) => switchFavorite(item.id, v)}/>)}
                    </tbody>
                </table>
            </VirtualRow>
        </div>
    }
})

/**
 * 列表项视图中的项。
 */
const Item = defineComponent({
    props: {
        value: {type: null as any as PropType<Topic>, required: true},
        selected: {type: Boolean, default: false}
    },
    emits: ["rightClick", "switchFavorite"],
    setup(props, { emit }) {
        const { openDetailPane } = useTopicContext()

        const click = () => openDetailPane(props.value.id)

        const rightClick = () => emit("rightClick")

        const switchFavorite = () => emit("switchFavorite", !props.value.favorite)

        const { hover, ...hoverEvents } = useMouseHover()

        const dragEvents = useDraggable("topic", computed(() => ({
            id: props.value.id,
            name: props.value.name,
            type: props.value.type,
            color: props.value.color
        })))

        return () => <tr onContextmenu={rightClick} {...hoverEvents} style="height: 50px">
            <td class="is-width-45 is-cursor-pointer" onClick={click}>
                <span class={`has-text-${props.value.color}`} draggable={true} {...dragEvents}>{props.value.name}</span>
                {props.value.parentRoot && <span class={`tag is-light ml-4 is-${props.value.parentRoot.color}`}>
                    {TYPE_ICON_ELEMENTS[props.value.parentRoot.type]}
                    {props.value.parentRoot.name}
                </span>}
                {(props.value.otherNames?.length || null) && <p class="has-text-grey">
                    ({generateOtherNames(props.value.otherNames)})
                </p>}
            </td>
            <td class="is-width-5">
                {props.value.favorite ?
                    <i class="ml-2 fa fa-heart has-text-danger is-cursor-pointer" onClick={switchFavorite}/>
                : hover.value ?
                    <i class="ml-2 fa fa-heart has-text-grey is-cursor-pointer" onClick={switchFavorite}/>
                : null}
            </td>
            <td>
                {((props.value.type !== "UNKNOWN") || null) && TYPE_ITEM_ELEMENTS[props.value.type]}
            </td>
            <td class="is-width-40">
                <AnnotationAndKeywordsList keywords={props.value.keywords} annotations={props.value.annotations}/>
            </td>
            <td class="is-width-5">
                {(props.value.score || null) && <>
                    <span>{props.value.score}</span>
                    {STAR_ICON}
                </>}
            </td>
            <td class="is-width-5">
                {props.value.count ? `${props.value.count}项` : null}
            </td>
        </tr>
    }
})

const AnnotationAndKeywordsList = defineComponent({
    props: {
        keywords: {type: Array as PropType<string[]>, required: true},
        annotations: {type: Array as PropType<SimpleAnnotation[]>, required: true},
    },
    setup(props) {
        const max = 6

        const keywords = ref<string[]>([])
        const annotations = ref<SimpleAnnotation[]>([])
        const more = ref(false)

        watchEffect(() => {
            const keywordsSize = props.keywords.length, annotationsSize = props.annotations.length
            if(keywordsSize + annotationsSize <= max) {
                keywords.value = props.keywords
                annotations.value = props.annotations
                more.value = false
            }else if(annotationsSize < max) {
                annotations.value = props.annotations
                keywords.value = props.keywords.slice(0, max - annotationsSize)
                more.value = true
            }else{
                annotations.value = props.annotations.slice(0, max)
                keywords.value = []
                more.value = true
            }
        })

        return () => <>
            {annotations.value.map(annotation => <AnnotationElement value={annotation} class="mr-1"/>)}
            {keywords.value.map(keyword => <span class="tag mr-1">{keyword}</span>)}
            {more.value && <span class="tag mr-1">...</span>}
        </>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <><i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/><span class="mr-2">{TOPIC_TYPE_NAMES[type]}</span></>)

const TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)

const STAR_ICON = <span class="icon ml-1"><i class="fa fa-star"/></span>

function generateOtherNames(otherNames: string[]): string {
    const origin = otherNames.join(" / ")
    if(origin.length >= 64) {
        return origin.substr(0, 64) + "..."
    }
    return origin
}
