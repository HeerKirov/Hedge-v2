import { defineComponent, PropType, ref } from "vue"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import { useAppearance, useAppInfo } from "@/services/app"
import { clientPlatform, NativeTheme } from "@/functions/adapter-ipc"
import { useAuthSetting } from "@/services/app/app-settings"

export default defineComponent({
    setup() {
        return () => <div>
            <Appearance/>
            <Security/>
        </div>
    }
})

const Appearance = defineComponent({
    setup() {
        const appearance = useAppearance()

        const onClick = (value: NativeTheme) => () => {
            if(appearance.value) {
                appearance.value.theme = value
            }
        }

        return () => appearance.value && <div class="mb-6">
            <p class="is-size-medium">外观选项</p>
            <label class="label mt-2">主题</label>
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

const Security = defineComponent({
    setup() {
        const appInfo = useAppInfo()
        const authSetting = useAuthSetting()

        return () => authSetting.value && <div>
            <p class="mb-1 is-size-medium">安全选项</p>
            <PasswordBox password={authSetting.value?.password} onUpdate={v => authSetting.value!.password = v}/>
            {clientPlatform === "darwin" && <div class="mt-4">
                <label class="checkbox">
                    <CheckBox value={authSetting.value?.touchID} onUpdateValue={v => authSetting.value!.touchID = v}>使用touch ID进行登录认证</CheckBox>
                </label>
                <p class="is-size-7 has-text-grey">{appInfo.canPromptTouchID ? "您的mac支持touch ID。在每次登录前将首先尝试通过touch ID登录。" : "如果您的电脑支持touch ID，开启此选项，在每次登录前将首先尝试通过touch ID登录。"}</p>
            </div>}
        </div>
    }
})

const PasswordBox = defineComponent({
    props: {
        password: {type: null as any as PropType<string | null>, required: true}
    },
    emits: ['update'],
    setup(props, { emit }) {
        const editMode = ref(false)
        const value = ref("")

        const edit = () => {
            value.value = props.password ?? ""
            editMode.value = true
        }
        const accept = () => {
            if(value.value.length) {
                emit('update', value.value)
            }else{
                emit('update', null)
                value.value = ""
            }
            editMode.value = false
        }
        const cancel = () => editMode.value = false

        return () => editMode.value ? <div class="group mt-1">
            <Input type="password" class="is-small" value={value.value} onUpdateValue={v => value.value = v} focusOnMounted={true}/>
            <button class="button is-success square is-small" onClick={accept}><span class="icon"><i class="fa fa-check"/></span></button>
            <a onClick={cancel}>放弃更改</a>
        </div> : props.password ? <div>
            <span class="tag is-light is-success"><span class="mr-1"><i class="fa fa-key"/></span>已设置登录口令</span>
            <a class="ml-1" onClick={edit}>修改口令</a>
        </div> : <div>
            <span class="tag is-light"><span class="mr-1"><i class="fa fa-lock-open"/></span>未设置登录口令</span>
            <a class="ml-1" onClick={edit}>设置口令</a>
        </div>
    }
})
