import { HttpInstance, Response } from "../server"
import { IdResponse, LimitAndOffsetFilter, Link, ListResult, mapFromOrderList, OrderList } from "./generic"
import { SimpleAnnotation } from "./annotations"

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
        annotationsIds: data.annotationIds?.length ? data.annotationIds.join(",") : undefined
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
    create(form: TopicCreateForm): Promise<Response<IdResponse>>
    /**
     * 查看主题。
     * @exception NOT_FOUND
     */
    get(id: number): Promise<Response<DetailTopic>>
    /**
     * 更改主题。
     * @exception NOT_FOUND
     * @exception ALREADY_EXISTS ("Topic", "name", name) 主题重名
     * @exception NOT_EXISTS ("annotations"|"parentId", id) 指定的资源不存在
     * @exception NOT_SUITABLE ("annotations", id) 指定的资源不适用。对于annotations，此注解的target要求不能应用于此种类的tag
     * @exception RECURSIVE_PARENT 在父标签检查中发现了闭环
     * @exception ILLEGAL_CONSTRAINT ("type", "parent", parentType) 当前主题的类型和父主题的类型不能兼容
     */
    update(id: number, form: TopicUpdateForm): Promise<Response<null>>
    /**
     * 删除主题。
     * @exception NOT_FOUND
     */
    delete(id: number): Promise<Response<null>>
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
     * 手写的评分或关联的项目的平均分。
     */
    score: number | null
    /**
     * 关联的项目数量。
     */
    count: number
}

export interface DetailTopic extends Topic {
    /**
     * 主题的父标签。
     */
    parent: ParentTopic | null
    /**
     * 简介。
     */
    description: string
    /**
     * 相关链接。
     */
    links: Link[]
    /**
     * 手写的原始评分。
     */
     originScore: number | null
}

export interface ParentTopic {
    id: number
    name: string
    type: TopicType
}

export interface SimpleTopic {
    id: number
    name: string
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
}

export type TopicFilter = TopicQueryFilter & LimitAndOffsetFilter

export interface TopicQueryFilter {
    search?: string
    order?: OrderList<"id" | "name" | "score" | "count" | "createTime" | "updateTime">
    type?: TopicType
    favorite?: boolean
    parentId?: number
    annotationIds?: number[]
}
