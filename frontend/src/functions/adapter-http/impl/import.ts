import { date, datetime, LocalDate, LocalDateTime } from "@/utils/datetime"
import {
    FileNotFoundError, FileNotReadyError, IllegalFileExtensionError,
    NotFound, ResourceNotExist, ParamError, ParamNotRequired, ParamRequired
} from "../exception"
import { HttpInstance, Response } from "../server"
import { IdResponseWithWarnings, LimitAndOffsetFilter, ListResult, mapFromOrderList, OrderList } from "./generic"
import { Tagme } from "./illust"
import { TimeType } from "./setting-import"

export function createImportEndpoint(http: HttpInstance): ImportEndpoint {
    return {
        list: http.createQueryRequest("/api/imports", "GET", { 
            parseQuery: mapFromImportFilter, 
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToImportImage)}) 
        }),
        get: http.createPathRequest(id => `/api/imports/${id}`, "GET", { parseResponse: mapToDetailImportImage }),
        update: http.createPathDataRequest(id => `/api/imports/${id}`, "PATCH", { parseData: mapFromImportUpdateForm }),
        delete: http.createPathRequest(id => `/api/imports/${id}`, "DELETE"),
        import: http.createDataRequest("/api/imports/import", "POST"),
        upload: http.createDataRequest("/api/imports/upload", "POST", { parseData: mapFromUploadFile }),
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
        partitionTime: date.of(<string>data["partitionTime"]),
        orderTime: datetime.of(<string>data["orderTime"]),
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
    import(form: ImportForm): Promise<Response<IdResponseWithWarnings, FileNotFoundError | IllegalFileExtensionError>>
    /**
     * 通过file upload远程上传新项目。
     * @exception ILLEGAL_FILE_EXTENSION 不受支持的文件扩展名。
     * @exception:warning INVALID_REGEX (regex) 解析错误，解析规则的正则表达式有误。
     */
    upload(file: File): Promise<Response<IdResponseWithWarnings, IllegalFileExtensionError>>
    /**
     * 查看导入项目。
     * @exception NOT_FOUND
     * @exception PARAM_NOT_REQUIRED ("sourceId/sourcePart") source未填写时，不能填写更详细的id/part信息
     */
    get(id: number): Promise<Response<DetailImportImage, NotFound>>
    /**
     * 更改导入项目的元数据。
     * @exception NOT_EXIST ("source", source) 此source不存在
     * @exception PARAM_ERROR ("sourceId"/"sourcePart") 参数值错误，需要为自然数
     * @exception PARAM_REQUIRED ("sourceId"/"sourcePart") 需要这些参数
     * @exception PARAM_NOT_REQUIRED ("sourcePart"/"sourceId/sourcePart") 不需要这些参数
     * @exception NOT_FOUND
     */
    update(id: number, form: ImportUpdateForm): Promise<Response<null, NotFound | ResourceNotExist<"source", string> | ParamError | ParamRequired | ParamNotRequired>>
    /**
     * 删除导入项目。
     * @exception NOT_FOUND
     */
    delete(id: number): Promise<Response<null, NotFound>>
    /**
     * 批量更新导入项目的元数据。
     * @exception:warning INVALID_REGEX (regex) 解析错误，解析规则的正则表达式有误。
     */
    batchUpdate(form: ImportBatchUpdateForm): Promise<Response<IdResponseWithWarnings[], ResourceNotExist<"target", number[]>>>
    /**
     * 确认导入，将所有项目导入到图库。
     * @exception FILE_NOT_READY
     */
    save(): Promise<Response<ImportSaveResponse, FileNotReadyError>>
}

export interface ImportImage {
    id: number
    file: string
    thumbnailFile: string | null
    fileName: string | null
    source: string | null
    sourceId: number | null
    sourcePart: number | null
    tagme: Tagme[]
    partitionTime: LocalDate
    orderTime: LocalDateTime
}

export interface DetailImportImage extends ImportImage {
    filePath: string | null
    fileFromSource: string | null
    fileCreateTime: LocalDateTime | null
    fileUpdateTime: LocalDateTime | null
    fileImportTime: LocalDateTime | null
    createTime: LocalDateTime
}

export interface ImportSaveResponse {
    total: number
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
    setCreateTimeBy?: TimeType
    setOrderTimeBy?: TimeType
    partitionTime?: LocalDate
    analyseSource?: boolean
}

export type ImportFilter = ImportQueryFilter & LimitAndOffsetFilter

export interface ImportQueryFilter {
    search?: string
    order?: OrderList<"id" | "fileCreateTime" | "fileUpdateTime" | "fileImportTime" | "orderTime">
}
