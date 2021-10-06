import { HttpInstance, Response } from "@/functions/adapter-http"
import { ConflictingGroupMembersError, ResourceNotExist } from "../exception"
import { DepsTag } from "./tag"
import { DepsTopic } from "./topic"
import { DepsAuthor } from "./author"
import { SimpleAlbum } from "./album"

export function createUtilMetaEndpoint(http: HttpInstance): UtilMetaEndpoint {
    return {
        validate: http.createDataRequest("/api/utils/meta/validate", "POST"),
        suggest: http.createDataRequest("/api/utils/meta/suggest", "POST")
    }
}

/**
 * 工具API：元数据相关工具。
 */
export interface UtilMetaEndpoint {
    /**
     * 对元数据内容做推导，并校验是否合法。
     * 校验内容包括tag的类型匹配和冲突组情况。
     * 此API用于在tag editor中，实时对meta tag list的内容做校验，获得推导结果列表，并提出警告和错误信息。
     */
    validate(form: MetaUtilValidationForm): Promise<Response<MetaUtilValidation, ConflictingGroupMembersError | ResourceNotExist<"tags" | "authors" | "topics", number[]>>>
    suggest(form: MetaUtilRelatedIdentity): Promise<Response<MetaUtilSuggestion[], ResourceNotExist<"tags" | "topics" | "authors", number>>>
}

export interface MetaUtilValidation {
    topics: DepsTopic[]
    authors: DepsAuthor[]
    tags: DepsTag[]
    notSuitable: DepsTag[]
    conflictingMembers: ConflictingMembers[]
    forceConflictingMembers: ConflictingMembers[]
}

interface ConflictingMembers {
    group: DepsTag
    force: boolean
    members: DepsTag[]
}

export interface MetaUtilValidationForm {
    topics: number[] | null
    authors: number[] | null
    tags: number[] | null
}

export type MetaUtilSuggestion = MetaUtilSuggestionByParentCollection | MetaUtilSuggestionByAlbum | MetaUtilSuggestionByChildren | MetaUtilSuggestionByAssociate

interface AbstractMetaUtilSuggestion<T extends string> {
    type: T
    topics: DepsTopic[]
    authors: DepsAuthor[]
    tags: DepsTag[]
}
interface MetaUtilSuggestionByParentCollection extends AbstractMetaUtilSuggestion<"collection"> {
    collectionId: number
}
interface MetaUtilSuggestionByAlbum extends AbstractMetaUtilSuggestion<"album"> {
    album: SimpleAlbum
}
interface MetaUtilSuggestionByChildren extends AbstractMetaUtilSuggestion<"children"> {}
interface MetaUtilSuggestionByAssociate extends AbstractMetaUtilSuggestion<"associate"> {}

export type MetaUtilRelatedIdentity = { imageId: number } | { collectionId: number } | { albumId: number }
