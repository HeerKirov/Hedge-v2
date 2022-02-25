import { computed, defineComponent, ref, watch } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import GridImage from "@/components/elements/GridImage"
import { useToast } from "@/services/module/toast"
import { useHttpClient } from "@/services/app"
import { arrays } from "@/utils/collections"
import { useDialogSelfContext, useDialogService } from "../all"
import style from "./style.module.scss"

export interface AddToCollectionContext {
    addToCollection(images: number[], collectionId: number, onAdded?: () => void)
}

export interface AddToCollectionInjectionContext {
    images: number[]
    situations: {id: number, thumbnailFile: string, hasParent: boolean}[]
    collectionId: number
    onAdded?(): void
}

export const AddToCollectionContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const toast = useToast()
        const httpClient = useHttpClient()
        const props = useDialogSelfContext("addToCollection")

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
                    props.onAdded?.()
                    emit("close")
                }else{
                    toast.handleException(res.exception)
                }
            }
        }

        return () => <div class={style.content}>
            <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>添加图像到集合</b></p>
                <p class="mb-2 pl-1 w-100">将图像添加到此集合。选择并确认需要添加的图像：</p>
                <GridImage value={props.situations} columnNum={7} eachKey={i => i.id} divClass={style.item} eachSlot={(createImg, item, index) => <>
                    {createImg(item.thumbnailFile)}
                    <CheckBox class={style.checkbox} value={selections.value[index]} onUpdateValue={v => selections.value[index] = v}/>
                    {item.hasParent && <div class={style.hasParentFlag}><i class="fa fa-exclamation"/></div>}
                </>}/>
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

export function useAddToCollectionService(): AddToCollectionContext {
    const httpClient = useHttpClient()
    const { push } = useDialogService()

    return {
        async addToCollection(images, collectionId, onAdded) {
            const res = await httpClient.illustUtil.getImageSituation(images)
            if(res.ok) {
                const situations = res.data
                    .filter(item => item.belong === null || item.belong.id !== collectionId) //排除当前集合的项
                    .map(item => ({id: item.id, thumbnailFile: item.thumbnailFile, hasParent: item.belong !== null}))
                if(situations.length > 0) {
                    //解析后的列表如果不为空，那么确定打开对话框
                    push({
                        type: "addToCollection",
                        context: {images, collectionId, situations, onAdded}
                    })
                }
            }

        }
    }
}
