import { defineComponent } from "vue"
import { useAppearance } from "@/functions/app"
import { NativeTheme } from "@/functions/adapter-ipc"

export default defineComponent({
    setup() {
        const appearance = useAppearance()

        const onClick = (value: NativeTheme) => () => {
            if(appearance.value) {
                appearance.value.theme = value
            }
        }

        return () => appearance.value === undefined ? <div/> : <div>
            <p class="mb-1 is-size-medium">外观选项</p>
            <p class="mt-4">主题</p>
            <div class="mt-2">
                {buttons.map(([name, title, icon, style]) => <button onClick={onClick(name)} class={`button ${appearance.value?.theme === name ? "is-info" : ""} ${style}`}>
                    <span class="icon"><i class={`fa fa-${icon}`}/></span>
                    {appearance.value?.theme === name && <span>{title}</span>}
                </button>)}
            </div>
        </div>
    }
})

const buttons: [NativeTheme, string, string, string][] = [
    ["light", "标准模式", "sun", "no-radius-right"],
    ["dark", "暗黑模式", "moon", "no-radius-right no-radius-left"],
    ["system", "跟随系统", "cloud-sun", "no-radius-left"]
]
