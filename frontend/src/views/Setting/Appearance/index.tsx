import { defineComponent } from "vue"
import { useNativeTheme } from "@/functions/service"
import { NativeTheme } from "@/functions/adapter-ipc"

export default defineComponent({
    setup() {
        const theme = useNativeTheme()

        const onClick = (value: NativeTheme) => () => theme.value = value

        return () => <div>
            <p class="mb-1 is-size-medium">外观选项</p>
            <div class="mt-4">
                {buttons.map(([name, title, icon, style]) => <button onClick={onClick(name)} class={`button ${theme.value === name ? "is-info" : ""} ${style}`}>
                    <span class="icon"><i class={`fa fa-${icon}`}/></span>
                    {theme.value === name && <span>{title}</span>}
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
