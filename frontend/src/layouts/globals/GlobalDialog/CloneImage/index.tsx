import { computed, defineComponent, ref, Ref } from "vue"
import CheckBox from "@/components/forms/CheckBox"
import { ImageCompareTable, } from "@/layouts/displays"
import { ImagePropsCloneForm } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { splitRef } from "@/functions/utils/basic"
import { arrays } from "@/utils/collections"
import { useDialogSelfContext, useDialogService } from "../all"
import style from "./style.module.scss"

export interface CloneImageContext {
    /**
     * 打开一个对话框，执行图像关系克隆操作。
     * 可以预先指定from和to，也可以都不指定，在对话框里拖放解决。
     * 关系克隆操作可以选择要对哪些属性做克隆，以及要不要删除from图像。
     */
    clone(options: {from?: number, to?: number}, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void)
}

export interface CloneImageInjectionContext {
    from: number | null
    to: number | null
    onSucceed?(from: number, to: number, fromDeleted: boolean): void
}

export const CloneImageContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("cloneImage")

        const fromId = ref(props.from)
        const toId = ref(props.from)
        const ids = computed(() => [fromId.value, toId.value])
        const titles = ["FROM", "TO"]

        const exchange = () => {
            function exchangeRefValue<T>(a: Ref<T>, b: Ref<T>) {
                const tmp = a.value
                a.value = b.value
                b.value = tmp
            }

            exchangeRefValue(fromId, toId)
        }

        const update = (index: number, id: number) => {
            if(index === 0) fromId.value = id
            else toId.value = id
        }

        const options = useOptions(fromId, toId, (fromId, toId, deleted) => {
            props.onSucceed?.(fromId, toId, deleted)
            emit("close")
        })

        return () => <div class={style.content}>
            <div class={style.infoContent}>
                <p class="mt-2 pl-1 is-size-medium w-100"><b>属性克隆</b></p>
                <p class="mb-2 pl-1 w-100">将源图像的属性、关联关系完整地(或有选择地)复制给目标图像。</p>
                <ImageCompareTable columnNum={2} droppable={true} titles={titles} ids={ids.value} onUpdate={update}/>
            </div>
            <div class={style.actionContent}>
                <div class={style.scrollContent}>
                    <button class="button is-white w-100" onClick={exchange} disabled={fromId.value === null && toId.value === null}>
                        <span class="icon"><i class="fa fa-exchange-alt"/></span><span>交换源与目标</span>
                    </button>
                    <label class="label mt-2">选择克隆属性/关系</label>
                    {FORM_PROPS.map(key => <p class="mt-1"><CheckBox value={options.props[key].value} onUpdateValue={v => options.props[key].value = v}>{FORM_TITLE[key]}</CheckBox></p>)}
                    <label class="label mt-2">高级选项</label>
                    {FORM_OPTIONS.map(key => <p class="mt-1"><CheckBox value={options.options[key].value} onUpdateValue={v => options.options[key].value = v}>{FORM_TITLE[key]}</CheckBox></p>)}
                </div>
                <div class={style.bottom}>
                    <button class={`button is-${options.options.deleteFrom.value ? "danger" : "link"} w-100`}
                            disabled={fromId.value === null || toId.value === null}
                            onClick={options.execute}>
                        <span class="icon"><i class="fa fa-check"/></span><span>{options.options.deleteFrom.value ? "执行克隆并删除源图像" : "执行克隆"}</span>
                    </button>
                </div>
            </div>
        </div>
    }
})

function useOptions(fromId: Ref<number | null>, toId: Ref<number | null>, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void) {
    const toast = useToast()
    const httpClient = useHttpClient()
    const options = useLocalStorageWithDefault<Form>("dialog/clone-image/options", {
        score: true, favorite: true, description: true, tagme: true, metaTags: true, orderTime: true, collection: true, albums: true, folders: true
    })

    const execute = async () => {
        if(fromId.value !== null && toId.value !== null) {
            const { merge, deleteFrom, ...props } = options.value
            const res = await httpClient.illust.cloneImageProps({
                props, merge, deleteFrom, from: fromId.value, to: toId.value
            })
            if(res.ok) {
                onSucceed?.(fromId.value, toId.value, deleteFrom ?? false)
            }else{
                toast.handleException(res.exception)
            }
        }
    }

    return {
        props: arrays.toMap(FORM_PROPS, key => splitRef(options, key)),
        options: arrays.toMap(FORM_OPTIONS, key => splitRef(options, key)),
        execute
    }
}

type Form = ImagePropsCloneForm["props"] & {merge?: boolean, deleteFrom?: boolean}

const FORM_PROPS: (keyof Form)[] = ["score", "favorite", "description", "tagme", "metaTags", "partitionTime", "orderTime", "collection", "albums", "folders", "source"]
const FORM_OPTIONS: (keyof Form)[] = ["merge", "deleteFrom"]

const FORM_TITLE: {[key in keyof Form]: string} = {
    score: "评分",
    favorite: "收藏",
    description: "描述",
    tagme: "Tagme",
    metaTags: "标签",
    partitionTime: "时间分区",
    orderTime: "排序时间",
    collection: "所属集合",
    albums: "所属画集",
    folders: "所属目录",
    source: "来源",
    merge: "合并复合关系而不是覆盖",
    deleteFrom: "克隆完成后，删除源图像"
}

export function useCloneImageService(): CloneImageContext {
    const { push } = useDialogService()
    return {
        clone(options: { from?: number; to?: number }, onSucceed?: (from: number, to: number, fromDeleted: boolean) => void) {
            push({
                type: "cloneImage",
                context: {from: options.from ?? null, to: options.to ?? null, onSucceed}
            })
        }
    }
}

