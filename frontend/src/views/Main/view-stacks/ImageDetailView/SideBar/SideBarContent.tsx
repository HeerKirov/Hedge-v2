import { defineComponent, PropType, ref, toRef } from "vue"
import { SideBar } from "@/layouts/layouts/SideLayout"
import { useLocalStorageWithDefault } from "@/functions/app"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import SideBarDetailInfo from "./SideBarDetailInfo"
import SideBarOriginData from "./SideBarOriginData"
import SideBarRelatedItems from "./SideBarRelatedItems"
import SideBarFileInfo from "./SideBarFileInfo"

export default defineComponent({
    setup() {
        const tab = useLocalStorageWithDefault<TabType>("detail-view/side-bar/tab", "info")
        const updateTab = (v: TabType) => tab.value = v

        watchGlobalKeyEvent(e => {
            if(e.metaKey && (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4")) {
                updateTab(TAB_BUTTONS[parseInt(e.key) - 1].key)
                e.stopPropagation()
                e.preventDefault()
            }
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
        return () => <SideBar class="has-button-sidebar" v-slots={sideBarSlots}/>
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
