import { defineComponent, ref, Ref } from "vue"
import { useChannelSetting } from "@/functions/service/app-settings"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { channels, currentChannel, defaultChannel } = useChannelSetting()
        const selected: Ref<number | null> = ref(null)
        const onClick = (index: number) => () => {
            selected.value = selected.value !== index ? index : null
        }

        return () => <div class={style.root}>
            <div class="block">
                <p class="is-size-6"><i class="fa fa-coins mr-1"/>当前频道: <code>{currentChannel}</code></p>
                <p class="mt-4">频道是Hedge实行数据隔离的高级功能。以不同频道打开时，可以访问不同的数据、设置，与其他频道完全隔离。</p>
                <p class="mt-4">要切换频道，可以：</p>
                <p class="mt-1">1. 在下方的频道列表选择，随后App以另一个频道的身份重新启动。</p>
                <p class="mt-1">2. 通过命令行工具命令<code>hedge app</code>启动App。App将以与命令行工具一致的频道启动，在启动前切换命令行工具的channel至目标频道。</p>
                <p class="mt-4"><i class="fa fa-circle mr-1"/>默认频道: <code>{defaultChannel.value}</code></p>
            </div>
            <p class="mt-3 mb-3">频道列表</p>
            {channels.value.map(({ channel, isDefault }, index) => <div key={channel} class={style.channelItem}>
                <div class={["block", "is-light"]} onClick={onClick(index)}>
                    {channel}
                    {selected.value === index && (isDefault ? <div class={style.defaultButtons}>
                        默认频道
                    </div> : <div class={style.buttons}>
                        <button class="button is-small is-success"><span class="icon"><i class="fa fa-reply"/></span><span>以此频道的身份重新启动</span></button>
                        <button class="button is-small is-warning is-light"><span class="icon"><i class="fa fa-circle"/></span><span>设为默认频道</span></button>
                    </div>)}
                </div>
            </div>)}
            <div class={style.channelItem}>
                <div class="block is-success is-light">
                    <i class="fa fa-plus mr-2"/>新建频道
                </div>
            </div>
        </div>
    }
})