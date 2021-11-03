import { computed, defineComponent, PropType } from "vue"
import { FolderTreeNode } from "@/functions/adapter-http/impl/folder"
import { datetime } from "@/utils/datetime"
import { useExpandedValue, useFolderContext } from "../inject"

export default defineComponent({
    setup() {
        const { list: { data } } = useFolderContext()

        return () => <div class="w-100 h-100">
            <table class="table is-hoverable is-fullwidth no-wrap">
                <tbody>
                    {data.value.map(row => <Row key={row.id} data={row}/>)}
                </tbody>
            </table>
        </div>
    }
})

const Row = defineComponent({
    props: {
        data: {type: Object as PropType<FolderTreeNode>, required: true},
        indent: Number
    },
    setup(props) {
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

        const switchExpand = props.data.type === "NODE" ? () => {
            isExpanded!.value = !isExpanded!.value
        } : undefined

        return () => <>
            <tr>
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
            {isExpanded?.value && props.data.children?.map(child => <Row key={child.id} data={child} indent={props.indent ? props.indent + 1 : 1}/>)}
        </>
    }
})
