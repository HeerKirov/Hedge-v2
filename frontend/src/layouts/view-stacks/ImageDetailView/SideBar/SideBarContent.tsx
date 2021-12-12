import { defineComponent, PropType, toRef } from "vue"
import { SideBar } from "@/layouts/layouts/SideLayout"
import { useLocalStorageWithDefault } from "@/functions/app"
import { interceptGlobalKey } from "@/functions/feature/keyboard"
import SideBarDetailInfo from "./SideBarDetailInfo"
import SideBarOriginData from "./SideBarOriginData"
import SideBarRelatedItems from "./SideBarRelatedItems"
import SideBarFileInfo from "./SideBarFileInfo"

export default defineComponent({
    setup() {
        const tab = useLocalStorageWithDefault<TabType>("detail-view/collection-side-bar/tab", "info")
        const updateTab = (v: TabType) => tab.value = v

        interceptGlobalKey(["Meta+Digit1", "Meta+Digit2", "Meta+Digit3", "Meta+Digit4"], e => {
            updateTab(TAB_BUTTONS[parseInt(e.key.substr(5, 1)) - 1].key)
        })

        const sideBarSlots = {
            default() {
                const Panel = tab.value === "info" ? SideBarDetailInfo :
                              tab.value === "origin" ? SideBarOriginData :
                              tab.value === "related" ? SideBarRelatedItems :
                                SideBarFileInfo
                return <Panel/>
            },
            bottom() { return <BottomButtons tab={tab.value} onTab={updateTab}/> }
        }
        return () => <SideBar v-slots={sideBarSlots}/>
    }
})

type TabType = "info" | "origin" | "related" | "file"

const TAB_BUTTONS: {key: TabType, title: string, icon: string}[] = [
    {key: "info", title: "项目信息", icon: "info"},
    {key: "file", title: "文件信息", icon: "file-image"},
    {key: "related", title: "相关项目", icon: "dice-d6"},
    {key: "origin", title: "来源数据", icon: "file-invoice"},
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
