import { defineComponent, PropType } from "vue"

/**
 * 详情页面的侧边栏的底栏。
 */
export default defineComponent({
    props: {
        tab: {type: null as any as PropType<"info" | "origin" | "others">, required: true}
    },
    emits: ["updateTab"],
    setup(props, { emit }) {
        const buttons = [
            {key: "info", title: "图像信息", icon: "info", onClick() { emit("updateTab", "info") }},
            {key: "origin", title: "原始数据", icon: "file-invoice", onClick() { emit("updateTab", "origin") }},
            {key: "others", title: "相关项目", icon: "dice-d6", onClick() { emit("updateTab", "others") }},
        ]
        return () => <div class="buttons">
            {buttons.map(item => <button class="button is-small is-light mb-0 mr-1" onClick={item.onClick}>
                <span class={`icon ${props.tab === item.key ? "mr-1" : ""}`}><i class={`fa fa-${item.icon}`}/></span>{props.tab === item.key && item.title}
            </button>)}
        </div>
    }
})