import { defineComponent, PropType, toRef } from "vue"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import { DepsTag } from "@/functions/adapter-http/impl/tag"
import { DepsTopic } from "@/functions/adapter-http/impl/topic"
import { DepsAuthor } from "@/functions/adapter-http/impl/author"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { Response } from "@/functions/adapter-http"
import { ConflictingGroupMembersError, NotFound, ResourceNotExist, ResourceNotSuitable } from "@/functions/adapter-http/exception"
import { MetaUtilIdentity } from "@/functions/adapter-http/impl/util-meta"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useDialogSelfContext, useDialogServiceContext } from "../all"
import style from "./style.module.scss"

export interface EditMetaTagContext {
    /**
     * 打开编辑模式的面板，编辑指定的对象。
     */
    editIdentity(identity: MetaUtilIdentity, onUpdated?: () => void): void
    /**
     * 打开面板，对指定的内容列表进行编辑，并返回编辑后的结果列表。如果取消编辑，则返回undefined。
     */
    edit(data: CommonData): Promise<CommonData | undefined>
}

export type EditMetaTagInjectionContext = {
    mode: "identity"
    identity: MetaUtilIdentity
    onUpdated?(): void
} | {
    mode: "custom"
    data: CommonData
    resolve(_: CommonData | undefined): void
    cancel(): void
}

export const EditMetaTagContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("editMetaTag")

        const close = () => emit("close")

        return () => props.mode === "identity"
            ? <IdentityEditorContent identity={props.identity} onUpdated={props.onUpdated} onClose={close}/>
            : <CustomEditorContent {...props.data} onResolve={props.resolve} onClose={close}/>
    }
})

const IdentityEditorContent = defineComponent({
    props: {
        identity: {type: Object as PropType<MetaUtilIdentity>, required: true}
    },
    emits: ["updated", "close"],
    setup(props, { emit }) {
        const { data, setData } = useObjectEndpoint({
            path: toRef(props, "identity"),
            get: httpClient => ({ type, id }): Promise<Response<CommonData, NotFound>> => {
                if(type === "IMAGE" || type === "COLLECTION") {
                    return httpClient.illust.get(id)
                }else{
                    return httpClient.album.get(id)
                }
            },
            update: httpClient => async ({ type, id }, form: CommonForm): Promise<Response<null, CommonException>> => {
                const res: Response<null, CommonException> = type === "IMAGE" || type === "COLLECTION"
                    ? await httpClient.illust.update(id, form)
                    : await httpClient.album.update(id, form)

                if(res.ok) emit("updated")

                return res
            }
        })

        return () => <div class={style.content}>
            <MetaTagEditor tags={data.value?.tags ?? []} topics={data.value?.topics ?? []} authors={data.value?.authors ?? []} tagme={data.value?.tagme ?? []}
                           setData={setData} identity={props.identity} onClose={() => emit("close")}/>
        </div>
    }
})

const CustomEditorContent = defineComponent({
    props: {
        tags: Array as PropType<DepsTag[]>,
        topics: Array as PropType<DepsTopic[]>,
        authors: Array as PropType<DepsAuthor[]>,
        tagme: Array as PropType<Tagme[]>
    },
    emits: {
        resolve: (_: CommonData | undefined) => true,
        close: () => true
    },
    setup(props, { emit }) {
        const update = (form: Partial<CommonData>) => {
            if(form.topics || form.authors || form.tagme || form.tags) {
                emit("resolve", {
                    tags: form.tags ?? props.tags ?? [],
                    topics: form.topics ?? props.topics ?? [],
                    authors: form.authors ?? props.authors ?? [],
                    tagme: form.tagme ?? props.tagme
                })
            }else{
                emit("resolve", undefined)
            }
        }

        return () => <div class={style.content}>
            <MetaTagEditor tags={props.tags ?? []} topics={props.topics ?? []} authors={props.authors ?? []} tagme={props.tagme ?? []}
                           onUpdate={update} identity={null} onClose={() => emit("close")}/>
        </div>
    }
})

export function useEditMetaTagService(): EditMetaTagContext {
    const { push } = useDialogServiceContext()

    return {
        editIdentity(identity, onUpdated) {
            push({
                type: "editMetaTag",
                context: {mode: "identity", identity, onUpdated}
            })
        },
        edit(data: CommonData): Promise<CommonData | undefined> {
            return new Promise<CommonData | undefined>(resolve => {
                push({
                    type: "editMetaTag",
                    context: {mode: "custom", data, resolve, cancel: () => resolve(undefined)}
                })
            })
        }
    }
}

interface CommonData {
    tags: DepsTag[]
    topics: DepsTopic[]
    authors: DepsAuthor[]
    tagme?: Tagme[]
}

interface CommonForm {
    tags?: number[]
    topics?: number[]
    authors?: number[]
    tagme?: Tagme[]
}

type CommonException = NotFound | ResourceNotExist<"topics" | "authors" | "tags", number[]> | ResourceNotSuitable<"tags", number[]> | ConflictingGroupMembersError
