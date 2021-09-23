import { defineComponent, PropType } from "vue"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { useMouseHover } from "@/functions/utils/element"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { Author, AuthorType } from "@/functions/adapter-http/impl/author"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { AnnotationElement } from "@/layouts/display-components"
import { arrays } from "@/utils/collections"
import { AUTHOR_TYPE_ENUMS, AUTHOR_TYPE_ICONS, AUTHOR_TYPE_NAMES } from "@/definitions/author"
import { useAuthorContext } from "../inject"
import style from "./style.module.scss"

/**
 * 内容列表项视图。
 */
export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { dataView, detailMode, openDetailPane, closePane, openCreatePane } = useAuthorContext()

        const fastEndpoint = useFastObjectEndpoint({
            get: httpClient => httpClient.author.get,
            update: httpClient => httpClient.author.update,
            delete: httpClient => httpClient.author.delete
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
            <VirtualRow rowHeight={80} padding={{top: 6, bottom: 0, left: 12, right: 12}} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                {dataView.data.value.result.map(item => <Item key={item.id} value={item}
                                                                  selected={detailMode.value === item.id}
                                                                  onRightClick={() => popupmenu.popup(item.id)}
                                                                  onSwitchFavorite={(v: boolean) => switchFavorite(item.id, v)}/>)}
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

        return () => <div class={[style.item, "box"]} onMouseover={mouseover} onMouseleave={mouseleave}  onContextmenu={rightClick}>
            <div class={style.left}>
                {props.value.favorite ?
                    <i class="mr-3 mt-1 fa fa-heart has-text-danger is-cursor-pointer float-right" onClick={switchFavorite}/>
                    : hover.value ?
                        <i class="mr-3 mt-1 fa fa-heart has-text-grey is-cursor-pointer float-right" onClick={switchFavorite}/>
                        : null}
                <div class={[`has-text-${props.value.color}`, "is-size-medium", "is-cursor-pointer"]} onClick={click}><b>{props.value.name}</b></div>
                {(props.value.otherNames?.length || null) && <p class="has-text-grey mt-1">
                    {generateOtherNames(props.value.otherNames)}
                </p>}
            </div>
            <div class={style.right}>
                <div>
                    {((props.value.type !== "UNKNOWN") || null) && TYPE_ITEM_ELEMENTS[props.value.type]}
                    {(props.value.score || null) && <>
                        <span>{props.value.score}</span>
                        {STAR_ICON}
                    </>}
                    {props.value.count ? `${props.value.count}项` : null}
                </div>
                <AnnotationAndKeywordList annotations={props.value.annotations} keywords={props.value.keywords}/>
            </div>
        </div>
    }
})

const AnnotationAndKeywordList = defineComponent({
    props: {
        keywords: {type: Array as PropType<string[]>, required: true},
        annotations: {type: Array as PropType<SimpleAnnotation[]>, required: true},
    },
    setup(props) {
        return () => <div class={style.ankList}>
            {props.annotations.map(annotation => <AnnotationElement value={annotation} class="mr-1"/>)}
            {props.keywords.map(keyword => <span class="tag mr-1">{keyword}</span>)}
        </div>
    }
})

const TYPE_ITEM_ELEMENTS: {[type in AuthorType]: JSX.Element} =
    arrays.toMap(AUTHOR_TYPE_ENUMS, type => <><i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-1`}/><span class="mr-4">{AUTHOR_TYPE_NAMES[type]}</span></>)

const STAR_ICON = <span class="icon ml-1 mr-4"><i class="fa fa-star"/></span>

function generateOtherNames(otherNames: string[]): string {
    const origin = otherNames.join(" / ")
    if(origin.length >= 64) {
        return origin.substr(0, 64) + "..."
    }
    return origin
}
