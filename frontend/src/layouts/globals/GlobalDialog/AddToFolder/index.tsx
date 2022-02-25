import { computed, defineComponent, onMounted, PropType, Ref, ref, watch } from "vue"
import GridImage from "@/components/elements/GridImage"
import { FolderSituation } from "@/functions/adapter-http/impl/util-illust"
import { FolderTreeNode } from "@/functions/adapter-http/impl/folder"
import { useToast } from "@/services/module/toast"
import { useHttpClient } from "@/services/app"
import { useDialogSelfContext, useDialogService } from "../all"
import style from "./style.module.scss"

export interface AddToFolderContext {
    /**
     * 针对指定的images列表，检测在目标folder中的存在性。如果存在重复项，就打开对话框，指出哪些项是已存在的，并要求采取措施。
     * 返回值则是最终应该添加到folder中的项的列表。
     */
    existsCheck(illustIds: number[], folderId: number): Promise<number[] | undefined>
    /**
     * 打开一个对话框，选择要把当前的images列表添加到哪个folders中，并执行添加。
     * 如果这些项存在重复，也会执行existsCheck的流程。
     */
    addToFolder(illustIds: number[], onSuccess?: () => void): void
}

export type AddToFolderInjectionContext = {
    mode: "existsCheck"
    folderId: number
    illustIds: number[]
    folderSituations: FolderSituation[]
    duplicated: {id: number, thumbnailFile: string, ordinal: number}[]
    resolve(_: number[] | undefined): void
    cancel(): void
} | {
    "mode": "addToFolder"
    illustIds: number[]
    resolve?(): void
}

export const AddToFolderContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("addToFolder")

        return () => {
            if(props.mode === "existsCheck") {
                const resolve = (images: number[]) => {
                    props.resolve(images)
                    emit("close")
                }
                return <ExistCheck illustIds={props.illustIds} folderSituations={props.folderSituations} duplicated={props.duplicated} onResolve={resolve}/>
            }else{
                const resolve = () => {
                    props.resolve?.()
                    emit("close")
                }
                return <AddToFolder illustIds={props.illustIds} onResolve={resolve}/>
            }
        }
    }
})

const ExistCheck = defineComponent({
    props: {
        illustIds: {type: Array as PropType<number[]>, required: true},
        folderSituations: {type: Array as PropType<FolderSituation[]>, required: true},
        duplicated: {type: Array as PropType<{id: number, thumbnailFile: string, ordinal: number}[]>, required: true},
    },
    emits: {
        resolve: (_: number[]) => true
    },
    setup(props, { emit }) {
        const chooseMove = () => emit("resolve", props.illustIds)

        const chooseIgnore = () => emit("resolve", props.folderSituations.filter(d => d.ordinal === null).map(d => d.id))

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到目录</b></p>
                <p class="mb-2 pl-1 w-100">存在重复添加的图像。请确认处理策略：</p>
                <GridImage value={props.duplicated} columnNum={7} eachKey={i => i.id} divClass={style.item} eachSlot={(createImg, item) => <>
                    {createImg(item.thumbnailFile)}
                    <div class={style.ordinalFlag}><span>{item.ordinal + 1}</span></div>
                </>}/>
            </div>
            <div class={style.bottom}>
                <span class="ml-2 is-line-height-std">移动选项将重复图像移动到新位置；忽略选项则将这些图像保留在原位置。</span>
                <button class="button is-link float-right ml-1" onClick={chooseIgnore}>
                    <span class="icon"><i class="fa fa-check"/></span><span>忽略</span>
                </button>
                <button class="button is-link float-right" onClick={chooseMove}>
                    <span class="icon"><i class="fa fa-check"/></span><span>移动</span>
                </button>
            </div>
        </div>
    }
})

const AddToFolder = defineComponent({
    props: {
        illustIds: {type: Array as PropType<number[]>, required: true}
    },
    emits: {
        resolve: () => true
    },
    setup(props, { emit }) {
        const folderList = useFolderList()
        const folderRecent = useFolderRecent(folderList.indexedData)

        const selected = ref<number>()

        watch(folderRecent.data, (recent, old) => {
            if(selected.value === undefined && old === undefined && recent !== undefined && recent.length > 0) {
                selected.value = recent[0].id
            }
        })

        const click = (id: number) => selected.value = id

        const dblClick = (id: number) => {
            selected.value = id
            confirm().finally()
        }

        const { confirm, save, duplicatedCheckMode } = useFolderConfirm(selected, props.illustIds, () => emit("resolve"))

        return () => duplicatedCheckMode.value === undefined ? <div class={style.content}>
            <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到目录</b></p>
            <p class="mb-2 pl-1 w-100">选择要将图像添加到的目录：</p>
            <div class={style.twoColumns}>
                <div class={style.scrollContent}>
                    <table class="table is-hoverable is-fullwidth no-wrap mx-1">
                        <thead>
                            <tr>
                                <th colspan="2">最近使用</th>
                            </tr>
                        </thead>
                        <tbody>
                            {folderRecent.data.value && (folderRecent.data.value.length > 0
                                ? folderRecent.data.value.map(item => <AddToFolderRow key={item.id} {...item} selected={selected.value === item.id} onClick={() => click(item.id)} onDblclick={() => dblClick(item.id)}/>)
                                : <tr><td colspan="2" class="has-text-centered"><i class="has-text-grey">无最近使用项</i></td></tr>)}
                        </tbody>
                    </table>
                </div>
                <div class={style.scrollContent}>
                    <table class="table is-hoverable is-fullwidth no-wrap mx-1">
                        <thead>
                            <tr>
                                <th colspan="2">目录列表</th>
                            </tr>
                        </thead>
                        <tbody>
                        {folderList.data.value.map(item => <AddToFolderRow key={item.id} {...item} selected={selected.value === item.id} onClick={() => click(item.id)} onDblclick={() => dblClick(item.id)}/>)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class={style.bottom}>
                <button class="button is-link float-right ml-1" disabled={selected.value === undefined} onClick={confirm}>
                    <span class="icon"><i class="fa fa-check"/></span><span>确认</span>
                </button>
            </div>
        </div> : (
            <ExistCheck {...duplicatedCheckMode.value} onResolve={save}/>
        )
    }
})

function AddToFolderRow(props: FolderListItem & {selected: boolean}) {
    return <tr class={{"is-selected": props.selected}}>
        <td>{props.address}</td>
        <td class="has-text-right">{props.imageCount}项</td>
    </tr>
}

interface FolderListItem { id: number, address: string, imageCount: number }

function useFolderList() {
    const httpClient = useHttpClient()

    const data = ref<FolderListItem[]>([])

    const indexedData = ref<Record<number, {address: string, imageCount: number}>>()

    onMounted(async () => {
        function recursive(items: FolderTreeNode[], parentAddress: string | null, result: FolderListItem[], indexed: Record<number, {address: string, imageCount: number}>) {
            for (const item of items) {
                const address = parentAddress ? `${parentAddress} / ${item.title}` : item.title
                if(item.type === "FOLDER") {
                    result.push({id: item.id, address, imageCount: item.imageCount ?? 0})
                    indexed[item.id] = {address, imageCount: item.imageCount ?? 0}
                }else if(item.children && item.children.length > 0) {
                    recursive(item.children, address, result, indexed)
                }
            }
        }

        const res = await httpClient.folder.tree({})
        if(res.ok) {
            const result: FolderListItem[] = []
            const indexed: Record<number, {address: string, imageCount: number}> = {}
            recursive(res.data, null, result, indexed)
            data.value = result
            indexedData.value = indexed
        }
    })

    return {data, indexedData}
}

function useFolderRecent(indexedData: Ref<Record<number, {address: string, imageCount: number}> | undefined>) {
    const httpClient = useHttpClient()

    const indexList = ref<number[]>()

    onMounted(async () => {
        const res = await httpClient.pickerUtil.history.folders()
        if(res.ok) {
            indexList.value = res.data.map(i => i.id)
        }
    })

    const data: Ref<FolderListItem[] | undefined> = computed(() => indexList.value !== undefined && indexedData.value !== undefined ? indexList.value.map(id => {
        const { address, imageCount } = indexedData.value![id]
        return {id, address, imageCount}
    }) : undefined)

    return {data}
}

function useFolderConfirm(selected: Ref<number | undefined>, illustIds: number[], resolve: () => void) {
    const toast = useToast()
    const httpClient = useHttpClient()
    const duplicatedCheckMode = ref<{
        illustIds: number[]
        folderSituations: FolderSituation[]
        duplicated: {id: number, thumbnailFile: string, ordinal: number}[]
    }>()

    const confirm = async () => {
        if(selected.value !== undefined) {
            const res = await httpClient.illustUtil.getFolderSituation({illustIds, folderId: selected.value})
            if(res.ok) {
                const duplicated: {id: number, thumbnailFile: string, ordinal: number}[] = res.data.filter(d => d.ordinal !== null).map(d => ({id: d.id, thumbnailFile: d.thumbnailFile, ordinal: d.ordinal!}))
                if(duplicated.length <= 0) {
                    await save(illustIds)
                }else{
                    duplicatedCheckMode.value = {
                        illustIds,
                        folderSituations: res.data,
                        duplicated
                    }
                }
            }
        }
    }

    const save = async (images: number[]) => {
        if(selected.value !== undefined) {
            if(images.length > 0) {
                const res = await httpClient.folder.images.partialUpdate(selected.value, {action: "ADD", images})
                if(res.ok) {
                    resolve()
                    pushHistory(selected.value).finally()
                }else{
                    toast.handleException(res.exception)
                }
            }else if(images.length <= 0) {
                resolve()
                pushHistory(selected.value).finally()
            }
        }
    }

    const pushHistory = async (folderId: number) => {
        const res = await httpClient.pickerUtil.history.push({type: "FOLDER", id: folderId})
        if(!res.ok) {
            toast.handleException(res.exception)
        }
    }

    return {confirm, duplicatedCheckMode, save}
}

export function useAddToFolderService(): AddToFolderContext {
    const httpClient = useHttpClient()
    const { push } = useDialogService()

    return {
        async existsCheck(illustIds: number[], folderId: number): Promise<number[] | undefined> {
            const res = await httpClient.illustUtil.getFolderSituation({illustIds, folderId})
            if(res.ok) {
                const duplicated: {id: number, thumbnailFile: string, ordinal: number}[] = res.data.filter(d => d.ordinal !== null).map(d => ({id: d.id, thumbnailFile: d.thumbnailFile, ordinal: d.ordinal!}))
                if(duplicated.length <= 0) {
                    return illustIds
                }else{
                    return new Promise(resolve => {
                        push({
                            type: "addToFolder",
                            context: {mode: "existsCheck", folderId, illustIds, folderSituations: res.data, duplicated, resolve, cancel: () => resolve(undefined)}
                        })
                    })
                }
            }else{
                return undefined
            }
        },
        async addToFolder(illustIds: number[], onSuccess?: () => void) {
            push({
                type: "addToFolder",
                context: {mode: "addToFolder", illustIds, resolve: onSuccess}
            })
        }
    }
}
