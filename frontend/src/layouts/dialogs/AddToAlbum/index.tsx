import { defineComponent } from "vue"
import GridImage from "@/components/elements/GridImage"
import { AlbumSituation } from "@/functions/adapter-http/impl/util-illust"
import { useHttpClient } from "@/functions/app"
import { useDialogSelfContext, useDialogServiceContext } from "../all"
import style from "./style.module.scss"

export interface AddToAlbumContext {
    /**
     * 针对指定的images列表，检测在目标album中的存在性。如果存在重复项，就打开对话框，指出哪些项是已存在的，并要求采取措施。
     * 返回值则是最终应该添加到album中的项的列表。
     */
    existsCheck(images: number[], albumId: number): Promise<number[] | undefined>
}

export interface AddToAlbumInjectionContext {
    albumId: number
    illustIds: number[]
    albumSituations: AlbumSituation[]
    duplicated: {id: number, thumbnailFile: string, ordinal: number}[]
    resolve(_: number[] | undefined): void
    cancel(): void
}

export const AddToAlbumContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("addToAlbum")

        const chooseMove = () => {
            props.resolve(props.illustIds)
            emit("close")
        }

        const chooseIgnore = () => {
            const images = props.albumSituations.filter(d => d.ordinal === null).map(d => d.id)
            props.resolve(images)
            emit("close")
        }

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到画集</b></p>
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

export function useAddToAlbumService(): AddToAlbumContext {
    const httpClient = useHttpClient()
    const { push } = useDialogServiceContext()

    return {
        async existsCheck(illustIds: number[], albumId: number): Promise<number[] | undefined> {
            const res = await httpClient.illustUtil.getAlbumSituation({illustIds, albumId})
            if(res.ok) {
                const duplicated: {id: number, thumbnailFile: string, ordinal: number}[] = res.data.filter(d => d.ordinal !== null).map(d => ({id: d.id, thumbnailFile: d.thumbnailFile, ordinal: d.ordinal!}))
                if(duplicated.length <= 0) {
                    return illustIds
                }else{
                    return new Promise(resolve => {
                        push({
                            type: "addToAlbum",
                            context: {albumId, illustIds, albumSituations: res.data, duplicated, resolve, cancel: () => resolve(undefined)}
                        })
                    })
                }
            }else{
                return undefined
            }
        }
    }
}
