import { computed, defineComponent, inject, InjectionKey, PropType, provide, ref, Ref } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { SourceImageEditor, SourceKeyEditor, useSourceImageEditorData } from "@/layouts/editors"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useHttpClient } from "@/functions/app"
import { useMessageBox } from "@/functions/module/message-box"
import style from "./style.module.scss"

export interface SourceImageEditDialogContext {
    /**
     * 打开新建模式的面板。此模式下，从三种不同的创建模式选择其一并执行新建。
     */
    openCreateDialog(onCreated?: () => void): void
    /**
     * 打开编辑模式的面板。
     */
    edit(key: SourceKey, onUpdated?: () => void): void
}

interface SourceKey {
    source: string
    sourceId: number
}

export const SourceImageEditDialog = defineComponent({
    setup() {
        const { task } = inject(dialogInjection)!

        const visible = computed(() => task.value !== null)

        const close = () => task.value = null

        return () => <DialogBox visible={visible.value} onClose={close}>
            {task.value?.mode === "create"
                ? <CreateContent onCreated={task.value!.onCreated} onClose={close}/>
            : task.value?.mode === "update"
                ? <EditContent source={task.value!.source} sourceId={task.value!.sourceId} onUpdated={task.value!.onUpdated} onClose={close}/>
            : null}
        </DialogBox>
    }
})

const CreateContent = defineComponent({
    props: {
        onCreated: Function as PropType<() => void>
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        const messageBox = useMessageBox()
        const httpClient = useHttpClient()
        const { data, set, save } = useSourceImageEditorData(null, async d => {
            if(sourceKey.value.source !== null && sourceKey.value.sourceId) {
                const res = await httpClient.sourceImage.create({...d, source: sourceKey.value.source, sourceId: sourceKey.value.sourceId})
                if(res.ok) {
                    props.onCreated?.()
                    emit("close")
                }else{
                    if(res.exception.code === "ALREADY_EXISTS") {
                        messageBox.showOkMessage("prompt", "该来源数据已存在。", "请尝试编辑此来源数据。")
                    }else if(res.exception.code === "NOT_EXIST") {
                        messageBox.showOkMessage("error", "选择的来源类型不存在。")
                    }
                }
            }
        })

        const sourceKey = ref<{source: string | null, sourceId: number | null}>({source: null, sourceId: null})

        //在create时，只以source key是否有值作为can save的判断依据
        const disabled = computed(() => sourceKey.value.source === null || sourceKey.value.sourceId === null)

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="label mt-1">新建来源数据</p>
                <SourceKeyEditor {...sourceKey.value} onUpdateValue={v => sourceKey.value = v}/>
                <SourceImageEditor data={data} setProperty={set}/>
            </div>
            <div class={style.bottom}>
                <button class="button is-link float-right" disabled={disabled.value} onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </div>
    }
})

const EditContent = defineComponent({
    props: {
        source: {type: String, required: true},
        sourceId: {type: Number, required: true},
        onUpdated: Function as PropType<() => void>
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        const { info, ...editorData } = useEditorData(computed(() => ({source: props.source, sourceId: props.sourceId})))
        const { data, set, anyChanged, save } = useSourceImageEditorData(editorData.data, async d => {
            if (await editorData.setData(d)) {
                props.onUpdated?.()
                emit("close")
            }
        })

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                {info.value && <div class="mt-2">
                    <span class="is-size-large ml-1">{info.value.sourceTitle}</span>
                    {(info.value.sourceId > 0 || null) && <span class="is-size-medium ml-1">{info.value.sourceId}</span>}
                </div>}
                <SourceImageEditor data={data} setProperty={set}/>
            </div>
            <div class={style.bottom}>
                <button class="button is-link float-right" disabled={!anyChanged.value} onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </div>
    }
})

function useEditorData(key: Ref<SourceKey>) {
    const { data, setData } = useObjectEndpoint({
        path: key,
        get: httpClient => httpClient.sourceImage.get,
        update: httpClient => httpClient.sourceImage.update
    })

    const info = computed(() => data.value && ({sourceTitle: data.value.sourceTitle, sourceId: data.value.sourceId}))

    return {data, setData, info}
}

export function installSourceImageEditDialog() {
    provide(dialogInjection, { task: ref(null) })
}

export function useSourceImageEditDialog(): SourceImageEditDialogContext {
    const { task } = inject(dialogInjection)!

    return {
        openCreateDialog(onCreated) {
            task.value = {mode: "create", onCreated}
        },
        edit(key, onUpdated) {
            task.value = {mode: "update", ...key, onUpdated}
        }
    }
}

interface InjectionContext {
    task: Ref<{
        mode: "create"
        onCreated?(): void
    } | {
        mode: "update"
        source: string
        sourceId: number
        onUpdated?(): void
    } | null>
}

const dialogInjection: InjectionKey<InjectionContext> = Symbol()
