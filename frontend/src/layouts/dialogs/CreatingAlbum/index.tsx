import { defineComponent, ref } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import GridImage from "@/components/elements/GridImage"
import { StarlightEditor } from "@/layouts/editors"
import { AlbumCreateForm } from "@/functions/adapter-http/impl/album"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { useAsyncComputed } from "@/functions/utils/basic"
import { useHttpClient } from "@/functions/app"
import { useDialogSelfContext, useDialogServiceContext } from "../all"
import style from "./style.module.scss"

export interface CreatingAlbumContext {
    /**
     * 打开对话框以创建一个新的画集。
     * 对话框中可以编辑画集的基本信息，并显示初始images项列表。
     * @param images 给出初始images项列表。
     * @param onCreated 如果成功创建画集，则执行回调。
     */
    createAlbum(images?: number[], onCreated?: (albumId: number) => void): void
}

export interface CreatingAlbumInjectionContext {
    images: number[]
    onCreated?(albumId: number): void
}

export const CreatingAlbumContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const httpClient = useHttpClient()
        const props = useDialogSelfContext("creatingAlbum")

        const form = ref<AlbumCreateForm>({
            images: props.images
        })

        const creator = useObjectCreator({
            form,
            mapForm: f => f,
            create: httpClient => httpClient.album.create,
            afterCreate(result: IdResponse) {
                props.onCreated?.(result.id)
                emit("close")
            }
        })

        const images = useAsyncComputed([], async () => {
            if(props.images.length > 0) {
                const res = await httpClient.illustUtil.getImageSituation(props.images)
                if(res.ok) {
                    return res.data.map(item => ({id: item.id, thumbnailFile: item.thumbnailFile}))
                }
            }
            return []
        })

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>新建画集</b></p>
                <div class="mt-2">
                    <span class="label">标题</span>
                    <Input class="is-fullwidth" value={form.value.title ?? undefined} onUpdateValue={v => form.value.title = v}/>
                </div>
                <div class="mt-2">
                    <span class="label">简介</span>
                    <Textarea class="is-fullwidth" value={form.value.description ?? undefined} onUpdateValue={v => form.value.description = v}/>
                </div>
                <div class="mt-2">
                    <span class="label">评分</span>
                    <StarlightEditor value={form.value.score ?? null} onUpdateValue={v => form.value.score = v}/>
                </div>
                {(images.value.length || null) && <div class="mt-2">
                    <span class="label">图像列表预览</span>
                    <GridImage value={images.value.map(i => i.thumbnailFile)} columnNum={7}/>
                </div>}
            </div>
            <div class={style.bottom}>
                {(images.value.length || null) && <span class="ml-2 is-line-height-std">共{images.value.length}项</span>}
                <button class="button is-link float-right" onClick={creator.save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>保存</span>
                </button>
            </div>
        </div>
    }
})

export function useCreatingAlbumService(): CreatingAlbumContext {
    const { push } = useDialogServiceContext()

    return {
        createAlbum(images, onCreated) {
            push({
                type: "creatingAlbum",
                context: {images: images ?? [], onCreated}
            })
        }
    }
}
