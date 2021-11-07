import { computed, defineComponent, PropType, ref } from "vue"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { FolderTreeNode, FolderType } from "@/functions/adapter-http/impl/folder"
import { useMessageBox } from "@/functions/module/message-box"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { onKeyEnter } from "@/functions/feature/keyboard"
import { datetime } from "@/utils/datetime"
import { useExpandedValue, useFolderContext } from "../inject"

export default defineComponent({
    setup() {
        const { list: { data } } = useFolderContext()

        return () => <div class="w-100 h-100">
            <table class="table is-hoverable is-fullwidth no-wrap">
                <tbody>
                    <RowList data={data.value}/>
                </tbody>
            </table>
        </div>
    }
})

const RowList = defineComponent({
    props: {
        data: {type: Array as PropType<FolderTreeNode[]>, required: true},
        parentId: Number,
        indent: Number
    },
    setup(props) {
        const { list: { creator } } = useFolderContext()

        const creatorRowForThis = computed(() => creator.position.value !== null && creator.position.value.parentId === props.parentId)
        const creatorRowOrdinal = computed(() => creatorRowForThis.value ? creator.position.value!.ordinal : undefined)

        return () => {
            if(!creatorRowForThis.value) {
                return props.data.map((child, i) => <Row key={child.id} data={child} indent={props.indent} ordinal={i} parentId={props.parentId}/>)
            }else if(creatorRowOrdinal.value === undefined) {
                const rows = props.data.map((child, i) => <Row key={child.id} data={child} indent={props.indent} ordinal={i} parentId={props.parentId}/>)
                return [...rows, <CreatorRow key="creator" parentId={props.parentId} ordinal={undefined} indent={props.indent}/>]
            }else{
                const rows = props.data.map((child, i) => <Row key={child.id} data={child} indent={props.indent} ordinal={i} parentId={props.parentId}/>)
                return [...rows.slice(0, creatorRowOrdinal.value), <CreatorRow key="creator" parentId={props.parentId} ordinal={creatorRowOrdinal.value} indent={props.indent}/>, ...rows.slice(creatorRowOrdinal.value)]
            }
        }
    }
})

const Row = defineComponent({
    props: {
        data: {type: Object as PropType<FolderTreeNode>, required: true},
        ordinal: {type: Number, required: true},
        parentId: Number,
        indent: Number
    },
    setup(props) {
        const messageBox = useMessageBox()
        const { pane, view, list: { deleteFolder, expandedInfo, creator } } = useFolderContext()

        const selected = computed(() => pane.detailMode.value === props.data.id)

        const indentStyle = computed(() => props.indent ? {"marginLeft": `${props.indent * 1.5}em`} : undefined)
        const message = computed(() => {
            if(props.data.type === "FOLDER") {
                return <span class="pl-1">{props.data.imageCount!}项</span>
            }else if(props.data.type === "QUERY") {
                const query = props.data.query!
                return <code>{query.length > 25 ? query.substr(0, 25) + "..." : query}</code>
            }else{
                return undefined
            }
        })

        const isExpanded = props.data.type === "NODE" ? useExpandedValue(computed(() => props.data.id)) : undefined
        const switchExpand = props.data.type === "NODE" ? (e: Event) => {
            isExpanded!.value = !isExpanded!.value
            e.stopPropagation()
        } : undefined

        const click = () => pane.openDetailPane(props.data.id)

        const remove = async () => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", props.data.children?.length ? "此操作将级联删除下属的所有子项，且不可撤回。" : "此操作不可撤回。")) {
                await deleteFolder(props.data.id)
            }
        }

        const menu = usePopupMenu([
            ...(props.data.type === "FOLDER" ? [
                {type: "normal", label: "查看文件夹内容", click: () => view.openDetailView(props.data.id)}
            ] as const : props.data.type === "QUERY" ? [
                {type: "normal", label: "查询内容", click: () => view.openDetailView(props.data.id)}
            ] as const : [
                {type: "normal", label: "折叠全部节点", click: () => expandedInfo.setAllForChildren(props.data.id, false)},
                {type: "normal", label: "展开全部节点", click: () => expandedInfo.setAllForChildren(props.data.id, true)}
            ] as const),
            {type: "separator"},
            {type: "normal", label: "在此节点之前新建", click: () => creator.openCreatorRow(props.parentId, props.ordinal)},
            {type: "normal", label: "在此节点之后新建", click: () => creator.openCreatorRow(props.parentId, props.ordinal + 1)},
            ...(props.data.type === "NODE" ? [{type: "normal", label: "在节点下新建", click: () => creator.openCreatorRow(props.data.id, null)}] as const : []),
            {type: "separator"},
            {type: "normal", label: `删除${props.data.type === "FOLDER" ? "文件夹" : props.data.type === "QUERY" ? "查询" : "节点"}`, click: remove},
        ])

        return () => <>
            <tr onClick={click} onContextmenu={() => menu.popup()} class={{"is-selected": selected.value}}>
                <td class="is-width-45">
                    <span class="icon mr-1" style={indentStyle.value} onClick={switchExpand}>
                        {props.data.type === "FOLDER"
                                ? <i class="fa fa-folder"/>
                        : props.data.type === "QUERY"
                                ? <i class="fa fa-search"/>
                        : isExpanded!.value
                                ? <i class="fa fa-angle-down ml-half is-cursor-pointer"/>
                                : <i class="fa fa-angle-right ml-half is-cursor-pointer"/>
                        }
                    </span>
                    {props.data.title}
                </td>
                <td class="is-width-35">
                    {message.value}
                </td>
                <td class="is-width-20">
                    {datetime.toSimpleFormat(props.data.updateTime)}
                </td>
            </tr>
            {isExpanded?.value && <RowList data={props.data.children ?? []} indent={props.indent ? props.indent + 1 : 1} parentId={props.data.id}/>}
        </>
    }
})

const CreatorRow = defineComponent({
    props: {
        parentId: Number,
        ordinal: Number,
        indent: Number
    },
    setup(props) {
        const messageBox = useMessageBox()
        const { list: { createFolder, creator: { type, closeCreatorRow } } } = useFolderContext()

        const indentStyle = computed(() => props.indent ? {"marginLeft": `${props.indent * 1.5}em`} : undefined)

        const selects = [
            {value: "FOLDER", name: "文件夹"},
            {value: "QUERY", name: "查询"},
            {value: "NODE", name: "节点"},
        ]

        const title = ref<string>()

        const save = async () => {
            if(!title.value?.trim()) {
                messageBox.showOkMessage("prompt", "不合法的标题。", "标题不能为空。")
                return
            }
            const ok = await createFolder({title: title.value!.trim(), type: type.value, parentId: props.parentId, ordinal: props.ordinal}, e => {
                if(e.code === "ALREADY_EXISTS") {
                    messageBox.showOkMessage("prompt", "该标题的文件夹已存在。")
                }else{
                    return e
                }
            })
            if(ok) {
                closeCreatorRow()
            }
        }

        return () => <tr>
            <td colspan="3">
                <Select items={selects} class="is-small" style={indentStyle.value} value={type.value} onUpdateValue={v => type.value = v as FolderType}/>
                <Input class="is-small ml-1" value={title.value} onUpdateValue={v => title.value = v} placeholder="文件夹标题" refreshOnInput={true} onKeypress={onKeyEnter(save)}/>
                <button class="button is-small is-white ml-1" onClick={save}><span class="icon"><i class="fa fa-check"/></span><span>保存</span></button>
                <button class="button is-small is-white ml-1" onClick={closeCreatorRow}><span class="icon"><i class="fa fa-times"/></span><span>取消</span></button>
            </td>
        </tr>
    }
})
