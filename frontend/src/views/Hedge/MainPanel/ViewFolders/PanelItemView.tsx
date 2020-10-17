import { defineComponent, PropType } from "vue"
import { FolderItem } from "."

/**
 * 内容项视图。
 */
export default defineComponent({
    props: {
        items: {type: null as PropType<FolderItem[]>, required: true}
    },
    setup(props) {
        return () => <div id="panel-item-view">
            {props.items.map(item => <Item {...item}/>)}
        </div>
    }
})

/**
 * 内容项视图中的项。
 */
const Item = defineComponent({
    props: {
        title: String,
        count: Number,
        virtual: {type: Boolean, default: false}
    },
    setup(props) {
        return () => <div>
            <article class="media">
                <figure class="media-left">
                    <span class="icon"><i class={`fa fa-2x fa-${props.virtual ? "folder-minus" : "folder"}`}/></span>
                </figure>
                <div class="media-content">
                    <p><b>{props.title}</b></p>
                    <p class="is-size-7">{props.virtual ? "虚拟文件夹" : `${props.count}项`}</p>
                </div>
            </article>
        </div>
    }
})