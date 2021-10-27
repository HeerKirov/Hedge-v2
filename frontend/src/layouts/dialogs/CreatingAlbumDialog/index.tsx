import { defineComponent, inject, InjectionKey, PropType, provide, ref, Ref } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import DialogBox from "@/layouts/layouts/DialogBox"
import { StarlightEditor } from "@/layouts/editors"
import { AlbumCreateForm } from "@/functions/adapter-http/impl/album"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { useAsyncComputed } from "@/functions/utils/basic"
import { assetsUrl, useHttpClient } from "@/functions/app"
import style from "./style.module.scss"

export interface CreatingAlbumDialogContext {
    /**
     * 打开对话框以创建一个新的画集。
     * 对话框中可以编辑画集的基本信息，并显示初始images项列表。
     * @param images 给出初始images项列表。
     * @param onCreated 如果成功创建画集，则执行回调。
     */
    createAlbum(images?: number[], onCreated?: (albumId: number) => void): void
}

export const CreatingAlbumDialog = defineComponent({
    setup() {
        const { task } = inject(dialogInjection)!

        const close = () => task.value = null

        const onCreated = (albumId: number) => {
            if(task.value) {
                task.value.onCreated?.(albumId)
                task.value = null
            }
        }

        return () => <DialogBox visible={task.value !== null} onClose={close}>
            <Content initImages={task.value!.images} onCreated={onCreated}/>
        </DialogBox>
    }
})

const Content = defineComponent({
    props: {
        initImages: {type: Array as PropType<number[]>, required: true}
    },
    emits: {
        created: (_: number) => true
    },
    setup(props, { emit }) {
        const httpClient = useHttpClient()

        const form = ref<AlbumCreateForm>({
            images: props.initImages
        })

        const creator = useObjectCreator({
            form,
            mapForm: f => f,
            create: httpClient => httpClient.album.create,
            afterCreate(result: IdResponse) {
                emit("created", result.id)
            }
        })

        const images = useAsyncComputed([], async () => {
            if(props.initImages.length > 0) {
                const res = await httpClient.illustUtil.getImageSituation(props.initImages)
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
                    <ImageList images={images.value}/>
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

function ImageList(props: {images: {id: number, thumbnailFile: string}[]}) {
    return <div class={style.images}>
        {props.images.map(item => <div key={item.id} class={style.item}>
            <img src={assetsUrl(item.thumbnailFile)} alt={`item ${item.id}`}/>
        </div>)}
    </div>
}

export function installCreatingAlbumDialog() {
    provide(dialogInjection, { task: ref(null) })
}

export function useCreatingAlbumDialog(): CreatingAlbumDialogContext {
    const { task } = inject(dialogInjection)!

    return {
        createAlbum(images, onCreated) {
            task.value = {images: images ?? [], onCreated}
        }
    }
}

interface InjectionContext {
    task: Ref<{
        images: number[]
        onCreated?(albumId: number): void
    } | null>
}

const dialogInjection: InjectionKey<InjectionContext> = Symbol()
