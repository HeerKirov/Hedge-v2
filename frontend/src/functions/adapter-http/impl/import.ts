import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import { HttpInstance, Response } from "../server"
import { ErrorResult, IdResponseWithWarnings, LimitAndOffsetFilter, ListResult, mapFromOrderList, OrderList } from "./generic"
import { Tagme } from "./illust"
import { TimeType } from "./setting-import"

export function createImportEndpoint(http: HttpInstance): ImportEndpoint {
    return {
        list: http.createQueryRequest("/api/imports", "GET", { 
            parseQuery: mapFromImportFilter, 
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToImportImage)}) 
        }),
        get: http.createPathRequest(id => `/api/imports/${id}`, "GET", { parseResponse: mapToDetailImportImage }),
        update: http.createPathDataRequest(id => `/api/imports/${id}`, "POST", { parseData: mapFromImportUpdateForm }),
        delete: http.createPathRequest(id => `/api/imports/${id}`, "DELETE"),
        import: http.createDataRequest("/api/imports/import", "POST"),
        upload: http.createDataRequest("/api/imports/upload", "POST", { parseData: mapFromUploadFile }),
        analyseMeta: http.createDataRequest("/api/imports/analyse-meta", "POST"),
        batchUpdate: http.createDataRequest("/api/imports/batch-update", "POST", { parseData: mapFromBatchUpdateForm }),
        save: http.createRequest("/api/imports/save", "POST")
    }
}

function mapFromImportFilter(filter: ImportFilter): any {
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

function mapFromImportUpdateForm(form: ImportUpdateForm): any {
    return {
        ...form,
        partitionTime: form.partitionTime && date.toISOString(form.partitionTime),
        orderTime: form.orderTime && datetime.toISOString(form.orderTime),
        createTime: form.createTime && datetime.toISOString(form.createTime)
    }
}

function mapFromBatchUpdateForm(form: ImportBatchUpdateForm): any {
    return {
        ...form,
        partitionTime: form.partitionTime && date.toISOString(form.partitionTime)
    }
}

function mapToImportImage(data: any): ImportImage {
    return {
        ...data,
        fileImportTime: data["fileImportTime"] != null ? datetime.of(<string>data["fileImportTime"]) : null
    }
}

function mapToDetailImportImage(data: any): DetailImportImage {
    return {
        ...data,
        fileCreateTime: data["fileCreateTime"] != null ? datetime.of(<string>data["fileCreateTime"]) : null,
        fileUpdateTime: data["fileUpdateTime"] != null ? datetime.of(<string>data["fileUpdateTime"]) : null,
        fileImportTime: data["fileImportTime"] != null ? datetime.of(<string>data["fileImportTime"]) : null,
        partitionTime: date.of(<string>data["partitionTime"]),
        orderTime: datetime.of(<string>data["orderTime"]),
        createTime: datetime.of(<string>data["createTime"])
    }
}

/**
 * 导入项目。
 */
export interface ImportEndpoint {
    /**
     * 查询所有导入列表中的项目。
     */
    list(filter: ImportFilter): Promise<Response<ListResult<ImportImage>>>
    /**
     * 从本地文件系统导入新项目。
     * @exception FILE_NOT_FOUND 指定的文件无法找到。
     * @exception ILLEGAL_FILE_EXTENSION 不受支持的文件扩展名。
     * @exception:warning INVALID_REGEX (regex) 解析错误，解析规则的正则表达式有误。
     */
    import(form: ImportForm): Promise<Response<IdResponseWithWarnings>>
    /**
     * 通过file upload远程上传新项目。
     * @exception ILLEGAL_FILE_EXTENSION 不受支持的文件扩展名。
     * @exception:warning INVALID_REGEX (regex) 解析错误，解析规则的正则表达式有误。
     */
    upload(file: File): Promise<Response<IdResponseWithWarnings>>
    /**
     * 查看导入项目。
     * @exception NOT_FOUND
     * @exception PARAM_NOT_REQUIRED ("sourceId/sourcePart") source未填写时，不能填写更详细的id/part信息
     */
    get(id: number): Promise<Response<DetailImportImage>>
    /**
     * 更改导入项目的元数据。
     * @exception NOT_FOUND
     */
    update(id: number, form: ImportUpdateForm): Promise<Response<null>>
    /**
     * 删除导入项目。
     * @exception NOT_FOUND
     */
    delete(id: number): Promise<Response<null>>
    /**
     * 分析导入项目的元数据。
     * @exception:warning INVALID_REGEX (regex) 解析错误，解析规则的正则表达式有误。
     */
    analyseMeta(form: AnalyseMetaForm): Promise<Response<AnalyseMetaResponse>>
    /**
     * 批量更新导入项目的元数据。
     */
    batchUpdate(form: ImportBatchUpdateForm): Promise<Response<null>>
    /**
     * 确认导入，将所有项目导入到图库。
     * @exception:warning PARAM_REQUIRED ("sourceId"/"sourcePart") 需要这些参数
     * @exception:warning PARAM_NOT_REQUIRED ("sourcePart") 不需要这些参数
     */
    save(): Promise<Response<ImportSaveResponse>>
}

export interface ImportImage {
    id: number
    file: string
    thumbnailFile: string | null
    fileName: string | null
    fileImportTime: LocalDateTime | null
}

export interface DetailImportImage extends ImportImage {
    filePath: string | null
    fileFromSource: string | null
    fileCreateTime: LocalDateTime | null
    fileUpdateTime: LocalDateTime | null
    tagme: Tagme[]
    source: string | null
    sourceId: number | null
    sourcePart: number | null
    partitionTime: LocalDate
    orderTime: LocalDateTime
    createTime: LocalDateTime
}

export interface AnalyseMetaResponse {
    total: number
    succeed: number
    failed: number
    errors: {[id: number]: ErrorResult}
}

export interface ImportSaveResponse {
    total: number
    succeed: number
    errors: {[id: number]: ErrorResult}
}

export interface ImportForm {
    filepath: string
    removeOriginFile?: boolean
}

export interface ImportUpdateForm {
    tagme?: Tagme[]
    source?: string | null
    sourceId?: number | null
    sourcePart?: number | null
    partitionTime?: LocalDate
    orderTime?: LocalDateTime
    createTime?: LocalDateTime
}

export interface ImportBatchUpdateForm {
    target?: number[]
    tagme?: Tagme[]
    serCreateTimeBy?: TimeType
    setOrderTimeBy?: TimeType
    partitionTime?: LocalDate
}

export interface AnalyseMetaForm {
    target?: number[]
}

export type ImportFilter = ImportQueryFilter & LimitAndOffsetFilter

export interface ImportQueryFilter {
    order?: OrderList<"id" | "fileCreateTime" | "fileUpdateTime" | "fileImportTime" | "orderTime">
}
