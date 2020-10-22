import { defineComponent, PropType } from "vue"
import { TopicType, TopicItem } from "."

/**
 * 列表项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as PropType<TopicItem[]>, required: true}
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
        type: null as PropType<TopicType>,
        count: Number
    },
    setup(props) {
        return () => <tr>
            <td><a class="tag">{props.title}</a></td>{/*现在还没决定颜色。之后要染成对应类型的颜色*/}
            <td class="is-narrow is-size-7 pt-3">{topicTypeName[props.type]}</td>
            <td class="has-text-right is-size-7 pt-3">{props.count == null ? "" : `${props.count}项`}</td>
        </tr>
    }
})

const topicTypeName = {
    "copyright": "版权方",
    "work": "作品",
    "character": "角色"
}