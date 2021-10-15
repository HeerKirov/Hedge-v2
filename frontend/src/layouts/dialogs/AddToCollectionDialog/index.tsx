import { computed, defineComponent, inject, InjectionKey, PropType, provide, Ref, ref, watch } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import DialogBox from "@/layouts/layouts/DialogBox"
import { useToast } from "@/functions/module/toast"
import { assetsUrl, useHttpClient } from "@/functions/app"
import { arrays } from "@/utils/collections"
import style from "./style.module.scss"

export interface AddToCollectionDialogContext {
    addToCollection(images: number[], collectionId: number, onAdded?: () => void)
}

export const AddToCollectionDialog = defineComponent({
    setup() {
        const httpClient = useHttpClient()
        const { task } = inject(dialogInjection)!

        const situations = ref<{id: number, thumbnailFile: string, hasParent: boolean}[]>([])

        const close = () => task.value = null

        const addedEvent = () => {
            if(task.value) {
                task.value.onAdded?.()
                task.value = null
            }
        }

        watch(task, async (t) => {
            if(t !== null) {
                const res = await httpClient.illustUtil.getImageSituation(t.images)
                if(res.ok) {
                    situations.value = res.data
                        .filter(item => item.belong === null || item.belong.id !== t.collectionId) //排除当前集合的项
                        .map(item => ({id: item.id, thumbnailFile: item.thumbnailFile, hasParent: item.belong !== null}))
                    if(situations.value.length <= 0) {
                        //如果解析后的结果列表为空，那么直接终止此操作
                        close()
                    }
                }
            }else{
                situations.value = []
            }
        })

        return () => <DialogBox visible={situations.value.length > 0} onClose={close}>
            <Content collectionId={task.value!.collectionId} situations={situations.value} onAdded={addedEvent}/>
        </DialogBox>
    }
})

const Content = defineComponent({
    props: {
        situations: {type: Array as PropType<{id: number, thumbnailFile: string, hasParent: boolean}[]>, required: true},
        collectionId: {type: Number, required: true}
    },
    emits: {
        added: () => true
    },
    setup(props, { emit }) {
        const toast = useToast()
        const httpClient = useHttpClient()

        const selections = ref<boolean[]>([])
        const selectedCount = computed(() => selections.value.filter(i => i).length)
        const anyHasParent = computed(() => props.situations.some(item => item.hasParent))

        const selectAll = () => {
            selections.value = arrays.newArray(props.situations.length, () => true)
        }

        const selectReverse = () => {
            selections.value = selections.value.map(v => !v)
        }

        watch(() => props.situations, selectAll, {immediate: true})

        const save = async () => {
            const addedItems = props.situations.filter((_, index) => selections.value[index]).map(item => item.id)
            if(addedItems.length) {
                const res = await httpClient.illust.collection.images.update(props.collectionId, [props.collectionId, ...addedItems])
                if(res.ok) {
                    emit("added")
                }else{
                    toast.handleException(res.exception)
                }
            }
        }

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到集合</b></p>
                <p class="mb-2 pl-1 w-100">将图像添加到此集合。选择并确认需要添加的图像：</p>
                {props.situations.map((item, index) => <div key={item.id} class={style.item}>
                    <img src={assetsUrl(item.thumbnailFile)} alt={`item ${item.id}`}/>
                    <CheckBox class={style.checkbox} value={selections.value[index]} onUpdateValue={v => selections.value[index] = v}/>
                    {item.hasParent && <div class={style.hasParentFlag}><i class="fa fa-exclamation"/></div>}
                </div>)}
            </div>
            <div class={style.bottom}>
                <button class="button is-white has-text-link" onClick={selectAll}>
                    <span class="icon"><i class="fa fa-check-square"/></span><span>全选</span>
                </button>
                <button class="button is-white has-text-link" onClick={selectReverse}>
                    <span class="icon"><i class="far fa-check-square"/></span><span>反选</span>
                </button>
                <span class="ml-2 is-line-height-std">已选择{selectedCount.value}项，共{props.situations.length}项</span>
                {anyHasParent.value && <span class="ml-8 is-line-height-std is-size-small">
                    <span class="tag is-link mr-1"><i class="fa fa-exclamation"/></span>表示此图像已经属于另一个集合。
                </span>}
                <button class="button is-link float-right" disabled={selectedCount.value <= 0} onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span><span>确认</span>
                </button>
            </div>
        </div>
    }
})

export function installAddToCollectionDialog() {
    provide(dialogInjection, { task: ref(null) })
}

export function useAddToCollectionDialog(): AddToCollectionDialogContext {
    const { task } = inject(dialogInjection)!

    return {
        async addToCollection(images, collectionId, onAdded) {
            task.value = {images, collectionId, onAdded}
        }
    }
}

interface InjectionContext {
    task: Ref<{
        images: number[]
        collectionId: number
        onAdded?(): void
    } | null>
}

const dialogInjection: InjectionKey<InjectionContext> = Symbol()
