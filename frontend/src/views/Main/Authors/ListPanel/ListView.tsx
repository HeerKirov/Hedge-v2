import { defineComponent, PropType, ref, watchEffect } from "vue"
import { useMessageBox } from "@/functions/module"
import { usePopupMenu } from "@/functions/app"
import { useMouseHover } from "@/functions/utils/element"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { Author, AuthorType } from "@/functions/adapter-http/impl/author"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { arrays } from "@/utils/collections"
import { AUTHOR_TYPE_ENUMS, AUTHOR_TYPE_ICONS, AUTHOR_TYPE_NAMES } from "../define"
import { useAuthorContext } from "../inject"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { listEndpoint, detailMode, openDetailPane, closePane, openCreatePane } = useAuthorContext()

        const fastEndpoint = useFastObjectEndpoint({
            get: httpClient => httpClient.author.get,
            update: httpClient => httpClient.author.update,
            delete: httpClient => httpClient.author.delete
        })

        const switchFavorite = async (id: number, favorite: boolean) => {
            if(await fastEndpoint.setData(id, {favorite})) {
                const index = listEndpoint.operations.find(topic => topic.id === id)
                if(index != undefined) {
                    const topic = listEndpoint.operations.retrieve(index)!
                    listEndpoint.operations.modify(index, {...topic, favorite})
                }
            }
        }

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(detailMode.value === id) closePane()
                    const index = listEndpoint.operations.find(topic => topic.id === id)
                    if(index != undefined) listEndpoint.operations.remove(index)
                }
            }
        }

        const createByItem = async (id: number) => {
            const author = await fastEndpoint.getData(id)
            if(author != undefined) {
                openCreatePane({
                    name: author.name,
                    otherNames: author.otherNames,
                    type: author.type,
                    annotations: author.annotations,
                    keywords: author.keywords,
                    description: author.description,
                    favorite: author.favorite,
                    links: author.links,
                    score: author.score
                })
            }
        }

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click: openDetailPane},
            {type: "separator"},
            {type: "normal", label: "以此为模板新建", click: createByItem},
            {type: "separator"},
            {type: "normal", label: "删除此主题", click: deleteItem},
        ])

        return () => <div class="w-100 h-100">
            <VirtualRow rowHeight={50} padding={{top: 6, bottom: 6, left: 12, right: 12}} bufferSize={10} onUpdate={listEndpoint.dataUpdate} {...listEndpoint.data.value.metrics}>
                <table class="table is-fullwidth no-wrap">
                    <tbody>
                        {listEndpoint.data.value.result.map(item => <Item key={item.id} value={item}
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
        value: {type: null as any as PropType<Author>, required: true},
        selected: {type: Boolean, default: false}
    },
    emits: ["rightClick", "switchFavorite"],
    setup(props, { emit }) {
        const { openDetailPane } = useAuthorContext()

        const click = () => openDetailPane(props.value.id)

        const rightClick = () => emit("rightClick")

        const switchFavorite = () => emit("switchFavorite", !props.value.favorite)

        const { hover, mouseover, mouseleave } = useMouseHover()

        return () => <tr onContextmenu={rightClick} onMouseover={mouseover} onMouseleave={mouseleave} style="height: 50px">
            <td class="is-width-50 is-cursor-pointer" onClick={click}>
                <span class={`has-text-${props.value.color}`}>{props.value.name}</span>
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
            <td class="is-width-35">
                <TopicListTags keywords={props.value.keywords} annotations={props.value.annotations}/>
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

const TopicListTags = defineComponent({
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
            {annotations.value.map(annotation => <span class="tag mr-1">
                <b>[</b><span class="mx-1">{annotation.name}</span><b>]</b>
            </span>)}
            {keywords.value.map(keyword => <span class="tag mr-1">{keyword}</span>)}
            {more.value && <span class="tag mr-1">...</span>}
        </>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in AuthorType]: JSX.Element} =
    arrays.toMap(AUTHOR_TYPE_ENUMS, type => <><i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-1`}/><span class="mr-2">{AUTHOR_TYPE_NAMES[type]}</span></>)

const STAR_ICON = <span class="icon ml-1"><i class="fa fa-star"/></span>

function generateOtherNames(otherNames: string[]): string {
    const origin = otherNames.join(" / ")
    if(origin.length >= 64) {
        return origin.substr(0, 64) + "..."
    }
    return origin
}
