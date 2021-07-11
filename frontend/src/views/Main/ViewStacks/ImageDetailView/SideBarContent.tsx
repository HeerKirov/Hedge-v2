import { defineComponent, PropType, ref, toRef } from "vue"
import { SideBar } from "@/layouts/layouts/SideLayout"

export default defineComponent({
    setup() {
        const tab = ref<TabType>("info")
        const updateTab = (v: TabType) => tab.value = v

        const sideBarSlots = {
            default() {
                const Panel = tab.value === "info" ? DetailInfoPanel :
                    tab.value === "origin" ? OriginDataPanel :
                        RelatedItemsPanel
                return <Panel/>
            },
            bottom() { return <BottomButtons tab={tab.value} onTab={updateTab}/> }
        }
        return () => <SideBar v-slots={sideBarSlots}/>
    }
})

type TabType = "info" | "origin" | "related"

const TAB_BUTTONS: {key: TabType, title: string, icon: string}[] = [
    {key: "info", title: "项目信息", icon: "info"},
    {key: "origin", title: "来源数据", icon: "file-invoice"},
    {key: "related", title: "相关项目", icon: "dice-d6"}
]

const BottomButtons = defineComponent({
    props: {
        tab: {type: String as PropType<TabType>, required: true}
    },
    emits: ["tab"],
    setup(props, { emit }) {
        const tab = toRef(props, "tab")

        const onTab = (type: TabType) => () => emit("tab", type)

        return () => <div>
            {TAB_BUTTONS.map(item => <button class="button is-sidebar radius-large mr-1" onClick={onTab(item.key)}>
                <span class="idp-icon"><i class={`fa fa-${item.icon}`}/></span>{item.key === tab.value && <span class="ml-1">{item.title}</span>}
            </button>)}
        </div>
    }
})

const DetailInfoPanel = defineComponent({
    setup() {
        return () => <div/>
    }
})

const OriginDataPanel = defineComponent({
    setup() {
        return () => <div/>
    }
})

const RelatedItemsPanel = defineComponent({
    setup() {
        return () => <div/>
    }
})
