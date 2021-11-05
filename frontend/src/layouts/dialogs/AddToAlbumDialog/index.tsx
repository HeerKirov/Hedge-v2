import { defineComponent, inject, InjectionKey, provide, Ref, ref, SetupContext } from "vue"
import GridImage from "@/components/elements/GridImage"
import DialogBox from "@/layouts/layouts/DialogBox"
import { AlbumSituation } from "@/functions/adapter-http/impl/util-illust"
import { useHttpClient } from "@/functions/app"
import style from "./style.module.scss"

export interface AddToAlbumDialogContext {
    existsCheck(images: number[], albumId: number): Promise<number[] | undefined>
}

export const AddToAlbumDialog = defineComponent({
    setup() {
        const { task } = inject(dialogInjection)!

        const close = () => {
            if(task.value) {
                task.value.resolve(undefined)
                task.value = null
            }
        }

        const chooseMove = () => {
            if(task.value) {
                task.value.resolve(task.value.illustIds)
                task.value = null
            }
        }

        const chooseIgnore = () => {
            if(task.value) {
                const images = task.value!.albumSituations.filter(d => d.ordinal === null).map(d => d.id)
                task.value.resolve(images)
                task.value = null
            }
        }

        return () => <DialogBox visible={task.value !== null} onClose={close}>
            <Content albumId={task.value!.albumId} duplicated={task.value!.duplicated} onMove={chooseMove} onIgnore={chooseIgnore}/>
        </DialogBox>
    }
})

function Content(props: {duplicated: {id: number, thumbnailFile: string, ordinal: number}[], albumId: number}, { emit }: SetupContext<{move: () => true, ignore: () => true}>) {
    return <div class={style.content}>
        <div class={style.scrollContent}>
            <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到画集</b></p>
            <p class="mb-2 pl-1 w-100">存在重复添加的图像。请确认处理策略：</p>
            <GridImage value={props.duplicated} columnNum={7} eachKey={i => i.id} divClass={style.item} eachSlot={(createImg, item, index) => <>
                {createImg(item.thumbnailFile)}
                <div class={style.ordinalFlag}><span>{item.ordinal + 1}</span></div>
            </>}/>
        </div>
        <div class={style.bottom}>
            <span class="ml-2 is-line-height-std">移动选项将重复图像移动到新位置；忽略选项则将这些图像保留在原位置。</span>
            <button class="button is-link float-right ml-1" onClick={() => emit("ignore")}>
                <span class="icon"><i class="fa fa-check"/></span><span>忽略</span>
            </button>
            <button class="button is-link float-right" onClick={() => emit("move")}>
                <span class="icon"><i class="fa fa-check"/></span><span>移动</span>
            </button>
        </div>
    </div>
}

export function installAddToAlbumDialog() {
    provide(dialogInjection, { task: ref(null) })
}

export function useAddToAlbumDialog(): AddToAlbumDialogContext {
    const httpClient = useHttpClient()
    const { task } = inject(dialogInjection)!

    return {
        async existsCheck(illustIds: number[], albumId: number): Promise<number[] | undefined> {
            const res = await httpClient.illustUtil.getAlbumSituation({illustIds, albumId})
            if(res.ok) {
                const duplicated: {id: number, thumbnailFile: string, ordinal: number}[] = res.data.filter(d => d.ordinal !== null).map(d => ({id: d.id, thumbnailFile: d.thumbnailFile, ordinal: d.ordinal!}))
                if(duplicated.length <= 0) {
                    return illustIds
                }else{
                    return new Promise(resolve => {
                        if(task.value !== null) {
                            task.value.resolve(undefined)
                        }
                        task.value = {albumId, illustIds, albumSituations: res.data, duplicated, resolve}
                    })
                }
            }else{
                return undefined
            }
        }
    }
}

interface InjectionContext {
    task: Ref<{
        albumId: number
        illustIds: number[]
        albumSituations: AlbumSituation[]
        duplicated: {id: number, thumbnailFile: string, ordinal: number}[]
        resolve(_: number[] | undefined): void
    } | null>
}

const dialogInjection: InjectionKey<InjectionContext> = Symbol()
