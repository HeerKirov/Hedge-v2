import { defineComponent, toRef } from "vue"
import MetaTagEditor from "@/layouts/drawers/MetaTagEditor"
import { DepsTag } from "@/functions/adapter-http/impl/tag"
import { DepsTopic } from "@/functions/adapter-http/impl/topic"
import { DepsAuthor } from "@/functions/adapter-http/impl/author"
import { Tagme } from "@/functions/adapter-http/impl/illust"
import { Response } from "@/functions/adapter-http"
import {
    ConflictingGroupMembersError,
    NotFound,
    ResourceNotExist,
    ResourceNotSuitable
} from "@/functions/adapter-http/exception"
import { MetaUtilIdentity } from "@/functions/adapter-http/impl/util-meta"
import { useObjectEndpoint } from "@/functions/utils/endpoints/object-endpoint"
import { useDialogSelfContext, useDialogServiceContext } from "../all"
import style from "./style.module.scss"

export interface EditMetaTagContext {
    /**
     * 打开编辑模式的面板。
     */
    edit(identity: MetaUtilIdentity, onUpdated?: () => void): void
}

export interface EditMetaTagInjectionContext {
    identity: MetaUtilIdentity
    onUpdated?(): void
}

export const EditMetaTagContent = defineComponent({
    emits: ["close"],
    setup(_, { emit }) {
        const props = useDialogSelfContext("editMetaTag")

        const close = () => emit("close")

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

                if(res.ok && props.onUpdated) {
                    props.onUpdated()
                }

                return res
            }
        })

        return () => <div class={style.content}>
            <MetaTagEditor tags={data.value?.tags ?? []} topics={data.value?.topics ?? []} authors={data.value?.authors ?? []}
                           tagme={data.value?.tagme ?? []} setData={setData} identity={props.identity} onClose={close}/>
        </div>
    }
})

export function useEditMetaTagService(): EditMetaTagContext {
    const { push } = useDialogServiceContext()

    return {
        edit(identity, onUpdated) {
            push({
                type: "editMetaTag",
                context: {identity, onUpdated}
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
