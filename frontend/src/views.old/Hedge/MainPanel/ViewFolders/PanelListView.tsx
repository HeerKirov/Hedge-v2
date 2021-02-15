import { defineComponent, PropType } from "vue"
import { FolderItem } from "."

/**
 * 列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<FolderItem[]>, required: true}
    },
    setup(props) {
        return () => <div id="panel-list-view">
            <table class="table is-hoverable is-fullwidth">
                <tbody>
                    {props.items.map(item => <Item {...item}/>)}
                </tbody>
            </table>
        </div>
    }
})

/**
 * 列表项视图中的项。
 */
const Item = defineComponent({
    props: {
        title: String,
        count: Number,
        virtual: {type: Boolean, default: false}
    },
    setup(props) {
        return () => <tr>
            <td class="is-narrow"><span class="icon"><i class={`fa fa-${props.virtual ? "folder-minus" : "folder"}`}/></span></td>
            <td><b>{props.title}</b></td>
            <td class="has-text-right">{props.count == null ? "" : `${props.count}项`}</td>
        </tr>
    }
})