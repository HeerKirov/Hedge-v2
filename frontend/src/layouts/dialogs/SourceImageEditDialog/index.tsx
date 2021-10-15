import { computed, defineComponent, inject, InjectionKey, PropType, provide, ref, Ref } from "vue"
import DialogBox from "@/layouts/layouts/DialogBox"
import { SourceImageEditor, SourceKeyEditor, SourceSiteSelect, useSourceImageEditorData } from "@/layouts/editors"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useHttpClient } from "@/functions/app"
import { useMessageBox } from "@/functions/module/message-box"
import { useToast } from "@/functions/module/toast"
import { dialogManager } from "@/functions/module/dialog"
import { installSettingSite } from "@/functions/api/setting"
import style from "./style.module.scss"
import Input from "@/components/forms/Input";

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
        const tab = ref<"single" | "bulk" | "upload">("single")

        const onCreated = () => {
            props.onCreated?.()
            emit("close")
        }

        return () => <div class={style.content}>
            <div class={style.top}>
                <button class={`button is-white has-text-${tab.value === "single" ? "link" : "grey"} mr-1`} onClick={() => tab.value = "single"}>
                    <span class="icon"><i class="fa fa-robot"/></span>
                    <span>创建一条来源数据</span>
                </button>
                <button class={`button is-white has-text-${tab.value === "bulk" ? "link" : "grey"} mr-1`} onClick={() => tab.value = "bulk"}>
                    <span class="icon"><i class="fa fa-table"/></span>
                    <span>批量创建</span>
                </button>
                <button class={`button is-white has-text-${tab.value === "upload" ? "link" : "grey"} mr-1`} onClick={() => tab.value = "upload"}>
                    <span class="icon"><i class="fa fa-file-upload"/></span>
                    <span>导入数据</span>
                </button>
            </div>
            {tab.value === "single" ? <CreateSingleContent onCreated={onCreated}/>
                : tab.value === "bulk" ? <CreateBulkContent onCreated={onCreated}/>
                    : <CreateUploadContent onCreated={onCreated}/>}
        </div>
    }
})

const CreateSingleContent = defineComponent({
    emits: {created: () => true},
    setup(_, { emit }) {
        const messageBox = useMessageBox()
        const httpClient = useHttpClient()
        const { data, set, canSave, save } = useSourceImageEditorData(null, async d => {
            if(sourceKey.value.source !== null && sourceKey.value.sourceId) {
                const res = await httpClient.sourceImage.create({...d, source: sourceKey.value.source, sourceId: sourceKey.value.sourceId})
                if(res.ok) {
                    emit("created")
                }else{
                    if(res.exception.code === "ALREADY_EXISTS") {
                        messageBox.showOkMessage("prompt", "该来源数据已存在。", "请尝试编辑此来源数据。")
                    }else if(res.exception.code === "NOT_EXIST") {
                        messageBox.showOkMessage("error", "选择的来源类型不存在。")
                    }
                }
            }
        })

        const sourceKey = ref<{source: string| null, sourceId: number | null}>({source: null, sourceId: null})

        const disabled = computed(() => !canSave.value || sourceKey.value.source === null || sourceKey.value.sourceId === null)

        return () => <>
            <div class={style.scrollContent}>
                <SourceKeyEditor {...sourceKey.value} onUpdateValue={v => sourceKey.value = v}/>
                <SourceImageEditor data={data} setProperty={set}/>
            </div>
            <div class={style.bottom}>
                <button class="button is-link float-right" disabled={disabled.value} onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </>
    }
})

const CreateBulkContent = defineComponent({
    emits: {created: () => true},
    setup() {
        installSettingSite()

        return () => <>
            <div class={style.scrollContent}>

            </div>
            <div class={style.bottom}>
                <button class="button is-link float-right">
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </>
    }
})

const CreateUploadContent = defineComponent({
    emits: {created: () => true},
    setup(_ , { emit }) {
        const toast = useToast()
        const messageBox = useMessageBox()
        const httpClient = useHttpClient()

        const loading = ref(false)

        const openDialog = async () => {
            if(!loading.value) {
                const files = await dialogManager.openDialog({
                    title: "选择文件",
                    filters: [
                        {
                            name: "JSON数据文件(*.json)",
                            extensions: ["json"]
                        },
                        {
                            name: "行数据文件(*.txt)",
                            extensions: ["txt"]
                        }
                    ],
                    properties: ["openFile", "createDirectory"]
                })
                if(files) {
                    loading.value = true
                    const res = await httpClient.sourceImage.import({filepath: files[0]})
                    if(res.ok) {
                        toast.toast("导入完成", "info", "文件导入已完成。")
                        emit("created")
                    }else{
                        if(res.exception.code === "NOT_EXIST") {
                            messageBox.showOkMessage("error", "选择的来源类型不存在。")
                        }else if(res.exception.code === "FILE_NOT_FOUND") {
                            messageBox.showOkMessage("error", "选择的文件不存在。")
                        }else if(res.exception.code === "ILLEGAL_FILE_EXTENSION") {
                            messageBox.showOkMessage("error", "此文件扩展名不受支持。")
                        }else if(res.exception.code === "CONTENT_PARSE_ERROR") {
                            messageBox.showOkMessage("prompt", "文件解析失败。请检查文件内容与格式。", res.exception.message)
                        }
                    }
                    loading.value = false
                }
            }
        }

        return () => <div class={style.centerBoard}>
            <button class="button is-success is-medium" disabled={loading.value} onClick={openDialog}>
                <span class="icon"><i class="fa fa-plus"/></span>
                <span>{loading.value ? "正在导入" : "导入文件"}</span>
            </button>
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
        const { data, set, canSave, save } = useSourceImageEditorData(editorData.data, async d => {
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
                <button class="button is-link float-right" disabled={!canSave.value} onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </div>
    }
})

const BulkItem = defineComponent({
    props: {
        source: {type: null as any as PropType<string | null>, required: true},
        sourceId: {type: null as any as PropType<number | null>, required: true}
    },
    emits: {
        updateValue: (_: string | null, __: number | null) => true,
        delete: () => true
    },
    setup(props, { emit }) {
        const updateSource = (v: string | null) => {
            if(v === "__UNDEFINED" || v === null) {
                emit("updateValue", null, null)
            }else{
                emit("updateValue", v, props.sourceId)
            }
        }

        const updateId = (v: string | undefined) => emit("updateValue", props.source, v ? parseInt(v) : null)

        return () => <div>
            <SourceSiteSelect value={props.source} onUpdateValue={updateSource}/>
            <Input class="is-small is-width-small ml-1" placeholder="来源ID" value={props.sourceId?.toString()} onUpdateValue={updateId} refreshOnInput={true}/>
            <button class="button square is-danger" onClick={() => emit("delete")}>
                <span class="icon"><i class="fa fa-times"/></span>
            </button>
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
