import { defineComponent, reactive, ref, Ref, watch } from "vue"
import { useChannelSetting } from "@/functions/app/app-settings"
import Input from "@/components/forms/Input"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { channels, currentChannel, defaultChannel, setDefaultChannel, restart } = useChannelSetting()
        const selected: Ref<number | null> = ref(null)
        const onClick = (index: number) => () => {
            selected.value = selected.value !== index ? index : null
            openCreateMode.value = false
        }
        const openCreateMode = ref(false)
        const updateOpen = (v: boolean) => {
            openCreateMode.value = v
            if(v) selected.value = null
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
            <p class="my-3 is-size-medium">频道列表</p>
            {channels.value.map(({ channel, isDefault }, index) => <div key={channel} class={style.channelItem}>
                <div class={["block", "is-light"]} onClick={onClick(index)}>
                    {channel}
                    {selected.value === index && <div class={style.buttons}>
                        {currentChannel === channel
                            ? <button class="button is-small is-light" disabled><i>当前频道</i></button>
                            : <button class="button is-small is-success" onClick={() => restart(channel)}><span class="icon"><i class="fa fa-reply"/></span><span>以此频道的身份重新启动</span></button>
                        }
                        {isDefault
                            ? <button class="button is-small is-light" disabled><i>默认频道</i></button>
                            : <button class="button is-small is-warning is-light" onClick={() => setDefaultChannel(channel)}><span class="icon"><i class="fa fa-circle"/></span><span>设为默认频道</span></button>
                        }
                    </div>}
                </div>
            </div>)}
            <CreateChannel open={openCreateMode.value} onUpdateOpen={updateOpen} onRestart={restart}/>
        </div>
    }
})

const CreateChannel = defineComponent({
    props: {
        open: {type: Boolean, required: true}
    },
    emits: ['restart', 'updateOpen'],
    setup(props, { emit }) {
        const createMode = reactive({on: props.open, value: "", error: false})
        const switchCreateMode = (e: Event) => {
            const target = e.target as HTMLElement
            if(target.id === "create-block") {
                createMode.on = !createMode.on
                createMode.error = false
                emit('updateOpen', createMode.on)
            }
        }
        const create = () => {
            if(createMode.value) {
                emit('restart', createMode.value)
            }else{
                createMode.error = true
            }
        }
        watch(() => props.open, v => createMode.on = v)

        return () => <div class={style.channelItem}>
            <div id="create-block" class="block is-success is-light" onClick={switchCreateMode}>
                <i class="fa fa-plus mr-2"/>新建频道
                {createMode.on && <div class={style.create}>
                    <Input class={{"is-small": true, "is-danger": createMode.error}} value={createMode.value} onUpdateValue={v => createMode.value = v}/>
                    <button class="button is-small is-success" onClick={create}><span class="icon"><i class="fa fa-reply"/></span><span>以此频道的身份重新启动</span></button>
                    <p class="has-text-grey">一个频道被创建并被初始化后，会被记录在频道列表中。</p>
                </div>}
            </div>
        </div>
    }
})
