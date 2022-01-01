import { ResourceNotExist } from "../exception"
import { HttpInstance, Response } from ".."
import { SimpleAuthor, SimpleTopic, SimpleTag } from "./all"
import { MetaType } from "./generic"

export function createSourceTagMappingEndpoint(http: HttpInstance): SourceTagMappingEndpoint {
    return {
        batchQuery: http.createDataRequest("/api/source-tag-mappings/batch-query", "POST"),
        get: http.createPathRequest(({ source, tagName }) => `/api/source-tag-mappings/${encodeURIComponent(source)}/${encodeURIComponent(tagName)}`),
        update: http.createPathDataRequest(({ source, tagName }) => `/api/source-tag-mappings/${encodeURIComponent(source)}/${encodeURIComponent(tagName)}`, "PUT"),
        delete: http.createPathRequest(({ source, tagName }) => `/api/source-tag-mappings/${encodeURIComponent(source)}/${encodeURIComponent(tagName)}`, "DELETE")
    }
}

export interface SourceTagMappingEndpoint {
    batchQuery(query: BatchQueryForm): Promise<Response<BatchQueryResult[]>>
    get(key: SourceTagKey): Promise<Response<SourceMappingTargetDetail[]>>
    update(key: SourceTagKey, mappings: SourceMappingTargetItem[]): Promise<Response<null, SourceTagMappingExceptions["update"]>>
    delete(key: SourceTagKey): Promise<Response<null, SourceTagMappingExceptions["delete"]>>
}

export interface SourceTagMappingExceptions {
    "update": ResourceNotExist<"source", string> | ResourceNotExist<"authors" | "topics" | "tags", number[]>
    "delete": ResourceNotExist<"source", string>
}

interface SourceTagKey {
    source: string
    tagName: string
}

export interface SourceTag {
    name: string
    displayName: string | null
    type: string | null
}

export interface SourceMappingMetaItem extends SourceTag {
    source: string
}

export interface SourceMappingTargetItem {
    metaType: MetaType
    metaId: number
}

export type SourceMappingTargetDetail = { metaType: "AUTHOR", metaTag: SimpleAuthor }
    | { metaType: "TOPIC", metaTag: SimpleTopic }
    | { metaType: "TAG", metaTag: SimpleTag }

export interface BatchQueryResult {
    tagName: string
    mappings: SourceMappingTargetDetail[]
}

export interface SourceTagForm {
    name: string
    displayName?: string
    type?: string
}

export interface SourceMappingMetaItemForm extends SourceTagForm {
    source: string
}

export interface BatchQueryForm {
    source: string
    tagNames: string[]
}
