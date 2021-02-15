import { defineComponent, ref, Ref } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const channels: Ref<string[]> = ref(["inside", "other"])
        const selected: Ref<number | null> = ref(null)
        const onClick = (index: number) => () => {
            selected.value = index
        }

        return () => <div class={style.root}>
            <div class="notification">
                <p><i class="fa fa-coins mr-1"/>当前频道: <code>default</code></p>
                <p class="is-size-7 mt-4">频道是Hedge实行数据隔离的高级功能。以不同频道打开时，可以访问不同的数据、设置，与其他频道完全隔离。</p>
                <p class="is-size-7 mt-4">要切换频道，可以：</p>
                <p class="is-size-7 mt-1">1. 在下方的频道列表选择，随后App以另一个频道的身份重新启动。</p>
                <p class="is-size-7 mt-1">2. 通过命令行工具命令<code>hedge app</code>启动App，在启动前切换命令行工具的channel至目标频道。</p>
                <p class="is-size-7 mt-1">2. 通过命令行直接启动App，并使用<code>--channel {'{CHANNEL_NAME}'}</code>参数启动。</p>
                <p class="is-size-7 mt-4"><i class="fa fa-circle mr-1"/>默认频道: <code>default</code></p>
            </div>
            <p class="mb-3">其他频道</p>
            {channels.value.map((channel, index) => <div key={channel} class={style.channelItem}>
                <div class={{"notification": true, "is-light": true, "is-info": index === selected.value}} onClick={onClick(index)}>
                    {channel}
                </div>
                {selected.value === index && <>
                    <button class="button is-success ml-2"><i class="fa fa-reply mr-2"/>以此频道的身份重新启动</button>
                    <button class="button is-warning is-light ml-1"><i class="fa fa-circle mr-2"/>设为默认频道</button>
                </>}
            </div>)}
            <div class={style.channelItem}>
                <div class="notification is-info is-light">
                    <i class="fa fa-plus mr-2"/>新建频道
                </div>
            </div>
        </div>
    }
})