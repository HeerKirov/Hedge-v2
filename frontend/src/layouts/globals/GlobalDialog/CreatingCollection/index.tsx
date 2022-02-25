import { defineComponent, ref } from "vue"
import { CollectionSituation } from "@/functions/adapter-http/impl/util-illust"
import { assetsUrl, useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { useDialogSelfContext, useDialogService } from "../all"
import style from "./style.module.scss"

export interface CreatingCollectionContext {
    /**
     * 传入一组images，创建一个集合。
     * 会对这组images做校验。如果images都是真正的image，且都不属于任何集合，那么会干脆利落地直接创建；
     * 如果不，那么会列出当前属于的集合，选择是否要加入某个集合，或建一个新的，把所有images(或collection的children)都塞进去。
     * @param images 要用作创建集合的image id列表。
     * @param onCreated 如果成功创建集合，则执行回调。
     */
    createCollection(images: number[], onCreated?: (collectionId: number, newCollection: boolean) => void): void
    /**
     * 与上一个方法一致，区别在于，总是会强制打开dialog用于确认。
     */
    createCollectionForceDialog(images: number[], onCreated?: (collectionId: number, newCollection: boolean) => void): void
}

export interface CreatingCollectionInjectionContext {
    situations:CollectionSituation[]
    images: number[]
    onCreated?(collectionId: number, newCollection: boolean): void
}

export const CreatingCollectionContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const toast = useToast()
        const httpClient = useHttpClient()
        const props = useDialogSelfContext("creatingCollection")

        const selected = ref<number | "new">("new")

        const execute = async () => {
            if(selected.value === "new") {
                await createNew()
            }else{
                await appendToExist(selected.value)
            }
        }

        const createNew = async () => {
            const res = await httpClient.illust.collection.create({images: props.images})
            if(res.ok) {
                props.onCreated?.(res.data.id, true)
                emit("close")
            }else{
                toast.handleException(res.exception)
            }
        }

        const appendToExist = async (collectionId: number) => {
            const res = await httpClient.illust.collection.images.update(collectionId, props.images)
            if(res.ok) {
                props.onCreated?.(collectionId, false)
                emit("close")
            }else{
                toast.handleException(res.exception)
            }
        }

        return () => <div class={style.content}>
            {props.situations.length > 0 ? <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium"><b>合并集合</b></p>
                <p class="mb-2 pl-1">一些图像已经属于某个集合，或者选中了一些集合作为集合内容。</p>
                <NewItem selected={selected.value === "new"} onClick={() => selected.value = "new"}/>
                {props.situations.map(s => <SituationItem key={s.id} situation={s} selected={selected.value === s.id} onClick={() => selected.value = s.id}/>)}
            </div> : <div class={style.scrollContent}>
                <p class="mt-2 pl-1 is-size-medium"><b>创建集合</b></p>
                <p class="mb-2 pl-1">不存在已属于其他集合的图像，这是一次全新的创建。</p>
                <NewItem selected={selected.value === "new"} onClick={() => selected.value = "new"}/>
            </div>}
            <div class={style.bottom}>
                <span class="is-line-height-std">合并后，原先的其他集合会被删除。</span>
                <button class="button is-link float-right" onClick={execute}>
                    <span class="icon"><i class="fa fa-check"/></span><span>确认</span>
                </button>
            </div>
        </div>
    }
})

function NewItem(props: {selected: boolean}) {
    return <div class={[style.item, "border-block", "mt-1", `has-border-${props.selected ? "link" : "more-deep-light"}`]}>
        <div class={style.itemRightColumn}>
            <p class="is-size-large">创建全新的集合</p>
            <p>将选中的图像，及选中集合的图像全部加入新集合。</p>
        </div>
    </div>
}

function SituationItem(props: {selected: boolean, situation: CollectionSituation}) {
    const [cover, ...children] = props.situation.childrenExamples
    return <div class={[style.item, "border-block", "mt-1", `has-border-${props.selected ? "link" : "more-deep-light"}`]}>
        <div class={style.itemLeftColumn}>
            <img class={style.itemImg} src={assetsUrl(cover.thumbnailFile)} alt={`collection ${props.situation.id} cover`}/>
        </div>
        <div class={style.itemRightColumn}>
            <p class={style.title}>合并到集合<i class="fa fa-id-card mx-2"/><b class="can-be-selected">{props.situation.id}</b></p>
            {children.map(child => <img class={style.exampleImg} alt={`example ${child.id}`} src={assetsUrl(child.thumbnailFile)}/>)}
            <span class={style.counter}>共{props.situation.childrenCount}项</span>
        </div>
    </div>
}

export function useCreatingCollectionService(): CreatingCollectionContext {
    const toast = useToast()
    const httpClient = useHttpClient()
    const { push } = useDialogService()

    return {
        async createCollection(images, onCreated) {
            const res = await httpClient.illustUtil.getCollectionSituation(images)
            if(res.ok) {
                const situations = res.data
                if(situations.length > 0) {
                    //若存在任何返回的situations，则需要对集合做决断，打开dialog
                    push({
                        type: "creatingCollection",
                        context: {situations, images, onCreated}
                    })
                }else{
                    //不需要决断，则直接创建新集合
                    const res = await httpClient.illust.collection.create({images})
                    if(res.ok) {
                        onCreated?.(res.data.id, true)
                    }else{
                        toast.handleException(res.exception)
                    }
                }
            }else{
                toast.handleException(res.exception)
            }
        },
        async createCollectionForceDialog(images, onCreated) {
            const res = await httpClient.illustUtil.getCollectionSituation(images)
            if(res.ok) {
                //总是打开dialog，对内容做确认
                push({
                    type: "creatingCollection",
                    context: {situations: res.data, images, onCreated}
                })
            }else{
                toast.handleException(res.exception)
            }
        }
    }
}
