import { defineComponent, inject, PropType, Ref, ref, watch } from "vue"

export type PanelType = "timeline" | "calendar"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    props: {
        panel: {type: null as any as PropType<PanelType>}
    },
    emits: ["updatePanel"],
    setup(props, { emit }) {
        const panel = ref(props.panel ?? "timeline")
        watch(() => props.panel, () => { panel.value = props.panel ?? "timeline" })
        const onCalendarPanel = () => {
            panel.value = "calendar"
            emit("updatePanel", panel.value)
        }
        const onTimelinePanel = () => {
            panel.value = "timeline"
            emit("updatePanel", panel.value)
        }

        return () => <div class="h-middle-layout absolute stretch">
            <div class="left">
                <span class="ml-3">{panel.value === "calendar" ? "日历" : "时间线"}</span>
            </div>
            <div class="right">
                <div class="buttons has-addons">
                    <button class={`button no-drag is-small ${panel.value === "timeline" ? "is-link" : ""}`} onClick={onTimelinePanel}>
                        <i class="fa fa-lg fa-sort-amount-down"/>
                    </button>
                    <button class={`button no-drag is-small ${panel.value === "calendar" ? "is-link" : ""}`} onClick={onCalendarPanel}>
                        <i class="fa fa-lg fa-calendar"/>
                    </button>
                </div>
            </div>
        </div>
    }
})
