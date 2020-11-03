import { ComponentInternalInstance, defineComponent, onMounted, PropType, reactive, ref, watch } from "vue"
import { arrays } from "../../../../utils/collections"
import { getDaysOfMonth } from "../../../../utils/datetime"

/**
 * 时间线形态的面板。
 */
export default defineComponent({
    setup() {
        const mainList = arrays.newArray<ListItem>(31, i => ({name: `2020-10-${i + 1}`, title: `2020年10月${i + 1}日`, count: i * 100, anchor: i == 0 ? "2020-10" : undefined}))
        const monthList = arrays.newArray<ListItem>(12, i => ({name: `2020-${i + 1}`, title: `2020年${i + 1}月`, count: i * 300}))

        const mainAnchor = ref<string | undefined>(undefined)

        const clickMonthList = (v: string) => {
            mainAnchor.value = v
        }

        return () => <div id="panel-timeline">
            <div class="v-left-column">
                <Timeline items={mainList} colored={true} anchor={mainAnchor.value} onClearAnchor={() => mainAnchor.value = undefined}/>
            </div>
            <div class="v-right-column">
                <Timeline items={monthList} onClick={clickMonthList} small={true}/>
            </div>
        </div>
    }
})

interface ListItem {
    name: string
    title: string
    count?: number
    anchor?: string
}

/**
 * 时间项的列表。
 */
const Timeline = defineComponent({
    props: {
        items: {type: null as any as PropType<ListItem[]>, required: true},
        small: {type: Boolean, default: false},
        colored: {type: Boolean, default: false},
        anchor: String,
    },
    emits: ["clearAnchor", "click"],
    setup(props, { emit }) {
        let anchors: {[name: string]: HTMLDivElement} = {}
        let latestAnchor: HTMLDivElement | undefined = undefined
        const refAnchor = (item: ListItem, latest: boolean) => (e: ComponentInternalInstance | Element | null) => {
            if(item.anchor) {
                anchors[item.anchor] = e as HTMLDivElement
            }
            if(latest) {
                latestAnchor = e as HTMLDivElement
            }
        }
        const scroll = () => {
            if(props.anchor) {
                emit("clearAnchor")
            }
        }
        const triggerAnchor = () => {
            if(props.anchor) {
                anchors[props.anchor]?.scrollIntoView()
            }
        }
        onMounted(() => {
            latestAnchor?.scrollIntoView()
            triggerAnchor()
        })
        watch(() => props.anchor, triggerAnchor)

        const onClick = (item: ListItem) => () => {
            emit("click", item.name)
        }

        return () => {
            anchors = {}
            return <div class="v-timeline" onScroll={scroll}>
                {props.items.map((item, i, items) => <div 
                        onClick={onClick(item)} 
                        ref={refAnchor(item, i == items.length - 1)} 
                        class={`notification ${props.colored ? "is-link" : ""} ${props.small ? "small" : ""}`}>
                    <i class="fa fa-th-list mr-2"/>{item.title}
                    {item.count ? <div class="count">{item.count}</div> : null}
                </div>)}
            </div>
        }
    }
})