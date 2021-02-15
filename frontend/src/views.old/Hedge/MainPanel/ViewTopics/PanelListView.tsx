import { defineComponent, PropType } from "vue"
import { TopicType, TopicItem } from "."

/**
 * 列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as any as PropType<TopicItem[]>, required: true}
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
        type: null as any as PropType<TopicType>,
        annotations: null as any as PropType<string[]>,
        favorite: Boolean,
        count: Number
    },
    setup(props) {
        const TOPIC_TYPE_TAG = {
            "copyright": <><i class="fa fa-copyright mr-2"/><span class="mr-2">版权方</span></>,
            "work": <><i class="fa fa-bookmark mr-2"/><span class="mr-2">作品</span></>,
            "character": <><i class="fa fa-user-ninja mr-2"/><span class="mr-2">角色</span></>
        }
        return () => <tr>
            <td>{props.title}</td>{/*现在还没决定颜色。之后要染成对应类型的颜色*/}
            <td class="is-narrow">{(props.favorite || null) && <i class="fa fa-heart is-danger"/>}</td>
            <td>
                {props.annotations?.map(a => <span class="tag mr-1">{a}</span>)}
            </td>
            <td class="is-narrow is-size-7 pt-3">{props.type && TOPIC_TYPE_TAG[props.type]}</td>
            <td class="has-text-right is-size-7 pt-3">{props.count == null ? "" : `${props.count}项`}</td>
        </tr>
    }
})