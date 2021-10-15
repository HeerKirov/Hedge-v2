import { AlreadyExists, ContentParseError, FileNotFoundError, IllegalFileExtensionError, NotFound, ResourceNotExist } from "../exception"
import { HttpInstance, Response } from ".."
import { LimitAndOffsetFilter, ListResult, mapFromOrderList, OrderList } from "./generic"
import { SimpleIllust } from "./illust"
import { SourceTag } from "./source-tag-mapping"
import { datetime, LocalDateTime } from "@/utils/datetime"

export function createSourceImageEndpoint(http: HttpInstance): SourceImageEndpoint {
    return {
        list: http.createQueryRequest("/api/source-images", "GET", {
            parseQuery: mapFromSourceImageFilter,
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToSourceImage)})
        }),
        create: http.createDataRequest("/api/source-images", "POST"),
        bulk: http.createDataRequest("/api/source-images/bulk", "POST", {
            parseData: items => ({items})
        }),
        upload: http.createDataRequest("/api/source-images/upload", "POST", {
            parseData: mapFromUploadFile
        }),
        import: http.createDataRequest("/api/source-images/import", "POST"),
        get: http.createPathRequest(({ source, sourceId }) => `/api/source-images/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}`, "GET", {
            parseResponse: mapToDetailSourceImage
        }),
        getRelatedImages: http.createPathRequest(({ source, sourceId }) => `/api/source-images/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}/related-images`),
        update: http.createPathDataRequest(({ source, sourceId }) => `/api/source-images/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}`, "PATCH"),
        delete: http.createPathRequest(({ source, sourceId }) => `/api/source-images/${encodeURIComponent(source)}/${encodeURIComponent(sourceId)}`, "DELETE")
    }
}

function mapToSourceImage(data: any): SourceImage {
    return {
        ...data,
        createTime: datetime.of(<string>data["createTime"]),
        updateTime: datetime.of(<string>data["updateTime"]),
    }
}

function mapToDetailSourceImage(data: any): DetailSourceImage {
    return {
        ...data,
        createTime: datetime.of(<string>data["createTime"]),
        updateTime: datetime.of(<string>data["updateTime"]),
    }
}

function mapFromSourceImageFilter(filter: SourceImageFilter): any {
    return {
        ...filter,
        order: mapFromOrderList(filter.order)
    }
}

function mapFromUploadFile(file: File): FormData {
    const form = new FormData()
    form.set("file", file)
    return form
}

export interface SourceImageEndpoint {
    list(filter: SourceImageFilter): Promise<Response<ListResult<SourceImage>>>
    create(form: SourceImageCreateForm): Promise<Response<null, SourceImageExceptions["create"]>>
    bulk(items: SourceImageCreateForm[]): Promise<Response<null, SourceImageExceptions["bulk"]>>
    upload(file: File): Promise<Response<null,  SourceImageExceptions["upload"]>>
    import(form: SourceImportForm): Promise<Response<null,  SourceImageExceptions["import"]>>
    get(key: SourceKey): Promise<Response<DetailSourceImage, NotFound>>
    getRelatedImages(key: SourceKey): Promise<Response<SimpleIllust[]>>
    update(key: SourceKey, form: SourceImageUpdateForm): Promise<Response<null, NotFound>>
    delete(key: SourceKey): Promise<Response<null, NotFound>>
}

interface SourceKey { source: string, sourceId: number }

export interface SourceImageExceptions {
    "create": ResourceNotExist<"source", string> | AlreadyExists<"SourceImage", "sourceId", number>
    "bulk": ResourceNotExist<"source", string>
    "upload": ResourceNotExist<"source", string> | IllegalFileExtensionError | ContentParseError
    "import": ResourceNotExist<"source", string> | IllegalFileExtensionError | FileNotFoundError | ContentParseError
}

interface BasicSourceImage {
    /**
     * source name。
     */
    source: string
    /**
     * source标题。自动从setting取得并填充。
     */
    sourceTitle: string
    /**
     * source id。
     */
    sourceId: number
}

export interface SourceImage extends BasicSourceImage {
    tagCount: number
    poolCount: number
    relationCount: number
    createTime: LocalDateTime
    updateTime: LocalDateTime
}

export interface DetailSourceImage extends BasicSourceImage {
    title: string
    description: string
    tags: SourceTag[]
    pools: string[]
    children: number[]
    parents: number[]
    createTime: LocalDateTime
    updateTime: LocalDateTime
}

export interface SourceImportForm {
    filepath: string
}

export interface SourceImageCreateForm extends SourceImageUpdateForm {
    source: string
    sourceId: number
}

export interface SourceImageUpdateForm {
    title?: string
    description?: string
    tags?: SourceTag[]
    pools?: string[]
    children?: number[]
    parents?: number[]
}

export type SourceImageFilter = SourceImageQueryFilter & LimitAndOffsetFilter

export interface SourceImageQueryFilter {
    /**
     * 使用HQL进行查询。list API不提示解析结果。
     */
    query?: string
    /**
     * 排序字段列表。
     */
    order?: OrderList<"rowId" | "sourceId" | "source" | "createTime" | "updateTime">
    /**
     * 按source类型过滤。
     */
    source?: string
    /**
     * 按source tag过滤。
     */
    sourceTag?: string
    /**
     * 按关联的image id过滤。
     */
    imageId?: number
}
