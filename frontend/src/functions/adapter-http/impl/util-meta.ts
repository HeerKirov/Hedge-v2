import { HttpInstance, Response } from "@/functions/adapter-http"
import { ConflictingGroupMembersError, ResourceNotExist } from "../exception"
import { DepsTag } from "./tag"

export function createUtilMetaEndpoint(http: HttpInstance): UtilMetaEndpoint {
    return {
        validateTag: http.createDataRequest("/api/utils/meta/validate/tags", "POST")
    }
}

/**
 * 工具API：元数据相关工具。
 */
export interface UtilMetaEndpoint {
    /**
     * 校验一个tag列表的合法性。
     * 校验内容包括tag的类型匹配和冲突组情况。
     * 此API用于在tag editor中，实时对tag list的内容做校验，并提出警告和错误信息。
     */
    validateTag(tags: number[]): Promise<Response<MetaTagValidation, ConflictingGroupMembersError | ResourceNotExist<"tags", number[]>>>
}

export interface MetaTagValidation {
    notSuitable: DepsTag[]
    conflictingMembers: ConflictingMembers[]
    forceConflictingMembers: ConflictingMembers[]
}

interface ConflictingMembers {
    group: DepsTag
    force: boolean
    members: DepsTag[]
}
