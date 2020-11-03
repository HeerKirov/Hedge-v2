import { defineComponent, PropType } from "vue"
import { AuthorType, AuthorItem } from "."

/**
 * 内容列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<AuthorItem[]>, required: true}
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
        name: String,
        type: null as any as PropType<AuthorType>,
        annotations: null as any as PropType<string[]>,
        favorite: Boolean,
        count: Number
    },
    setup(props) {
        const AUTHOR_TYPE_TAG = {
            "artist": <><i class="fa fa-paint-brush mr-2"/><span class="mr-2">画师</span></>,
            "studio": <><i class="fa fa-swatchbook mr-2"/><span class="mr-2">工作室</span></>,
            "publication": <><i class="fa fa-stamp mr-2"/><span class="mr-2">出版物</span></>
        }

        return () => <tr>
            <td>{props.name}</td>{/*现在还没决定颜色。之后要染成对应类型的颜色*/}
            <td class="is-narrow">{(props.favorite || null) && <i class="fa fa-heart is-danger"/>}</td>
            <td>
                {props.annotations?.map(a => <span class="tag mr-1">{a}</span>)}
            </td>
            <td class="is-narrow is-size-7 pt-3">{props.type && AUTHOR_TYPE_TAG[props.type]}</td>
            <td class="has-text-right is-size-7 pt-3">{props.count == null ? "" : `${props.count}项`}</td>
        </tr>
    }
})