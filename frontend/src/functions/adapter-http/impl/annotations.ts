import { HttpInstance, Response } from "../server"
import { IdResponse, LimitAndOffsetFilter } from "./generic"

export function createAnnotationEndpoint(http: HttpInstance): AnnotationEndpoint {
    return {
        list: http.createQueryRequest("/api/annotations"),
        create: http.createDataRequest("/api/annotations", "POST"),
        get: http.createPathRequest(id => `/api/annotations/${id}`),
        update: http.createPathDataRequest(id => `/api/annotations/${id}`, "PATCH"),
        delete: http.createPathRequest(id => `/api/annotations/${id}`, "DELETE")
    }
}

/**
 * 注解。
 */
export interface AnnotationEndpoint {
    /**
     * 查询注解列表。
     */
    list(filter: AnnotationFilter): Promise<Response<Annotation[]>>
    /**
     * 新建注解。
     * @exception ALREADY_EXISTS ("Annotation", "name", name) 注解重名
     */
    create(form: AnnotationCreateForm): Promise<Response<IdResponse>>
    /**
     * 查看注解。
     * @exception NOT_FOUND
     */
    get(id: number): Promise<Response<Annotation>>
    /**
     * 更改注解。
     * @exception NOT_FOUND
     * @exception ALREADY_EXISTS ("Annotation", "name", name) 注解重名
     */
    update(id: number, form: AnnotationUpdateForm): Promise<Response<unknown>>
    /**
     * 删除注解。
     * @exception NOT_FOUND
     */
    delete(id: number): Promise<Response<unknown>>
}

export type AnnotationTarget = "TAG" | "AUTHOR" | "TOPIC" | "ARTIST" | "STUDIO" | "PUBLISH" | "COPYRIGHT" | "WORK" | "CHARACTER"

export interface Annotation {
    /**
     * 注解id。
     */
    id: number
    /**
     * 注解名称。需要遵守tag name规范。
     */
    name: string
    /**
     * 注解可以被导出到项目。
     */
    canBeExported: boolean
    /**
     * 注解可以应用的目标标签类型。
     */
    target: AnnotationTarget[]
}

export interface SimpleAnnotation {
    id: number
    name: string
}

export interface AnnotationCreateForm {
    name: string
    canBeExported: boolean
    target: AnnotationTarget[]
}

export interface AnnotationUpdateForm {
    name?: string
    canBeExported?: boolean
    target?: AnnotationTarget[]
}

export interface AnnotationFilter extends LimitAndOffsetFilter {
    query?: string
    canBeExported?: boolean
    target?: AnnotationTarget
}