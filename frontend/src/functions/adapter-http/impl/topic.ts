import { HttpInstance, Response } from "../server"
import { IdResponse, LimitAndOffsetFilter, Link, ListResult, mapFromOrderList, OrderList } from "./generic"
import { SimpleAnnotation } from "./annotations"
import { SourceMappingMetaItem, SourceMappingMetaItemForm } from "./source-tag-mapping"
import {
    AlreadyExists, IllegalConstraintError, NotFound,
    RecursiveParentError,
    ResourceNotExist,
    ResourceNotSuitable
} from "../exception"

export function createTopicEndpoint(http: HttpInstance): TopicEndpoint {
    return {
        list: http.createQueryRequest("/api/topics", "GET", {
            parseQuery: mapFromTopicFilter
        }),
        create: http.createDataRequest("/api/topics", "POST"),
        get: http.createPathRequest(id => `/api/topics/${id}`),
        update: http.createPathDataRequest(id => `/api/topics/${id}`, "PATCH"),
        delete: http.createPathRequest(id => `/api/topics/${id}`, "DELETE")
    }
}

function mapFromTopicFilter(data: TopicFilter): any {
    return {
        ...data,
        order: mapFromOrderList(data.order),
        annotationIds: data.annotationIds?.length ? data.annotationIds.join(",") : undefined
    }
}

/**
 * 主题。
 */
export interface TopicEndpoint {
    /**
     * 查询主题列表。
     */
    list(filter: TopicFilter): Promise<Response<ListResult<Topic>>>
    /**
     * 新建主题。
     * @exception ALREADY_EXISTS ("Topic", "name", name) 主题重名
     * @exception NOT_EXISTS ("annotations"|"parentId", id) 指定的资源不存在
     * @exception NOT_SUITABLE ("annotations", id) 指定的资源不适用。对于annotations，此注解的target要求不能应用于此种类的tag
     * @exception RECURSIVE_PARENT 在父标签检查中发现了闭环
     * @exception ILLEGAL_CONSTRAINT ("type", "parent", parentType) 当前主题的类型和父主题的类型不能兼容
     */
    create(form: TopicCreateForm): Promise<Response<IdResponse, TopicExceptions["create"]>>
    /**
     * 查看主题。
     * @exception NOT_FOUND
     */
    get(id: number): Promise<Response<DetailTopic, NotFound>>
    /**
     * 更改主题。
     * @exception NOT_FOUND
     * @exception ALREADY_EXISTS ("Topic", "name", name) 主题重名
     * @exception NOT_EXISTS ("annotations"|"parentId", id) 指定的资源不存在
     * @exception NOT_SUITABLE ("annotations", id) 指定的资源不适用。对于annotations，此注解的target要求不能应用于此种类的tag
     * @exception RECURSIVE_PARENT 在父标签检查中发现了闭环
     * @exception ILLEGAL_CONSTRAINT ("type", "parent", parentType) 当前主题的类型和父主题的类型不能兼容
     */
    update(id: number, form: TopicUpdateForm): Promise<Response<null, TopicExceptions["update"]>>
    /**
     * 删除主题。
     * @exception NOT_FOUND
     */
    delete(id: number): Promise<Response<null, NotFound>>
}

export interface TopicExceptions {
    "create": AlreadyExists<"Topic", "name", string> | ResourceNotExist<"parentId", number> | ResourceNotExist<"annotations", number[]> | ResourceNotSuitable<"annotations", number[]> | RecursiveParentError | IllegalConstraintError<"type", "parent", TopicType[]> | ResourceNotExist<"source", string>
    "update": NotFound | AlreadyExists<"Topic", "name", string> | ResourceNotExist<"parentId", number> | ResourceNotExist<"annotations", number[]> | ResourceNotSuitable<"annotations", number[]> | RecursiveParentError | IllegalConstraintError<"type", "parent" | "children", TopicType[]> | ResourceNotExist<"source", string>
}

export type TopicType = "UNKNOWN" | "COPYRIGHT" | "WORK" | "CHARACTER"

export interface Topic {
    /**
     * topic id。
     */
    id: number
    /**
     * 主题名称。需要遵守tag name规范。
     */
    name: string
    /**
     * 其他名称。需要遵守tag name规范。
     */
    otherNames: string[]
    /**
     * 关键字。需要遵守tag name规范。
     */
    keywords: string[]
    /**
     * 所属的分组根节点。
     */
    parentRoot: ParentTopic | null
    /**
     * 父节点id。
     */
    parentId: number | null,
    /**
     * 主题类型。
     */
    type: TopicType
    /**
     * 标记为收藏。
     */
    favorite: boolean
    /**
     * 注解。
     */
    annotations: SimpleAnnotation[]
    /**
     * 评分。
     */
    score: number | null
    /**
     * 关联的项目数量。
     */
    count: number
    /**
     * 此topic的颜色。
     */
    color: string | null
}

export interface DetailTopic extends Topic {
    /**
     * 主题的父标签。
     */
    parents: ParentTopic[]
    /**
     * 主题的子标签。
     */
    children: TopicChildrenNode[] | null
    /**
     * 简介。
     */
    description: string
    /**
     * 相关链接。
     */
    links: Link[]
    /**
     * 映射到此元数据的来源标签。
     */
    mappingSourceTags: SourceMappingMetaItem[]
}

export interface SimpleTopic {
    id: number
    name: string
    type: TopicType
    color: string | null
}

export interface TopicChildrenNode extends SimpleTopic {
    children: TopicChildrenNode[] | null
}

export interface ParentTopic extends SimpleTopic {

}

export interface DepsTopic extends SimpleTopic {
    isExported: boolean
}

export interface TopicCreateForm {
    name: string
    otherNames?: string[] | null
    parentId?: number | null
    type?: TopicType
    description?: string
    keywords?: string[]
    links?: Link[] | null
    annotations?: (string | number)[] | null
    favorite?: boolean
    score?: number | null
    mappingSourceTags?: SourceMappingMetaItemForm[] | null
}

export interface TopicUpdateForm {
    name?: string
    otherNames?: string[] | null
    parentId?: number | null
    type?: TopicType
    description?: string
    keywords?: string[]
    links?: Link[] | null
    annotations?: (string | number)[] | null
    favorite?: boolean
    score?: number | null
    mappingSourceTags?: SourceMappingMetaItemForm[] | null
}

export type TopicFilter = TopicQueryFilter & LimitAndOffsetFilter

export interface TopicQueryFilter {
    query?: string
    order?: OrderList<"id" | "name" | "score" | "count" | "createTime" | "updateTime">
    type?: TopicType
    favorite?: boolean
    parentId?: number
    annotationIds?: number[]
}
