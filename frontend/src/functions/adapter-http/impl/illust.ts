import { dateOf, dateTimeOf, LocalDate, LocalDateTime } from "@/utils/datetime"
import { HttpInstance, Response } from "../server"
import { LimitAndOffsetFilter, ListResult, OrderList } from "./generic"
import { SimpleTopic } from "./topic"
import { SimpleAuthor } from "./author"
import { SimpleTag } from "./tag"


export function createIllustEndpoint(http: HttpInstance): IllustEndpoint {
    return {
        list: http.createQueryRequest("/api/illusts", "GET", {
            parseResponse: ({ total, result }: ListResult<any>) => ({total, result: result.map(mapToIllust)}),
            parseQuery: mapFromIllustFilter
        })
    }
}

function mapToIllust(data: any): Illust {
    return {
        id: <number>data["id"],
        type: <IllustType>data["type"],
        childrenCount: <number | null>data["childrenCount"],
        file: <string>data["file"],
        thumbnailFile: <string>data["thumbnailFile"],
        score: <number | null>data["score"],
        favorite: <boolean>data["favorite"],
        tagme: <Tagme[]>data["tagme"],
        orderTime: dateTimeOf(<string>data["orderTime"])
    }
}

function mapToDetailIllust(data: any): DetailIllust {
    return {
        ...mapToIllust(data),
        fileId: <number>data["fileId"],
        topics: <SimpleTopic[]>data["topics"],
        authors: <SimpleAuthor[]>data["authors"],
        tags: <SimpleTag[]>data["tags"],
        description: <string>data["description"],
        originDescription: <string>data["originDescription"],
        originScore: <number | null>data["originScore"],
        partitionTime: dateOf(<string>data["partitionTime"]),
        createTime: dateTimeOf(<string>data["createTime"]),
        updateTime: dateTimeOf(<string>data["updateTime"])
    }
}

function mapFromIllustFilter(data: IllustFilter) {
    return {
        ...data,
        partition: data.partition?.toISOString()
    }
}

/**
 * 项目。
 */
export interface IllustEndpoint {
    list(filter: IllustFilter): Promise<Response<ListResult<Illust>>>
}

export type IllustType = "COLLECTION" | "IMAGE"

export type Tagme = "TAG" | "AUTHOR" | "TOPIC" | "SOURCE"

interface IllustPublicPart {
    /**
     * illust id。
     */
    id: number
    /**
     * 此项目的文件路径。
     */
    file: string
    /**
     * 此项目的缩略图文件路径。缩略图有不存在的理论可能(未生成)，此时值为null，应该填充占位图像。
     */
    thumbnailFile: string | null
    /**
     * 此项目的评分。可能由手写评分或父子项目导出。
     */
    score: number | null
    /**
     * 是否收藏。
     */
    favorite: boolean
    /**
     * tagme标记。
     */
    tagme: Tagme[]
    /**
     * 此项目的排序时间。
     */
    orderTime: LocalDateTime
}

export interface Illust extends IllustPublicPart {
    /**
     * illust类型。
     */
    type: IllustType
    /**
     * 子项目的数量。只有类型为COLLECTION的项目会有子项目。
     */
    childrenCount: number | null
}

export interface DetailIllust extends IllustPublicPart {
    /**
     * 文件记录的id。
     */
    fileId: number
    /**
     * 主题。
     */
    topics: SimpleTopic[]
    /**
     * 作者。
     */
    authors: SimpleAuthor[]
    /**
     * 标签。
     */
    tags: SimpleTag[]
    /**
     * 描述。可能由手写描述或父集合导出。
     */
    description: string
    /**
     * 手写的原始描述。
     */
    originDescription: string
    /**
     * 手写的原始评分。
     */
    originScore: number | null
    /**
     * 分区时间。
     */
    partitionTime: LocalDate
    /**
     * 创建时间。
     */
    createTime: LocalDateTime
    /**
     * 关联的图像上次发生更新的时间。
     */
    updateTime: LocalDateTime
}

export interface SimpleIllust {
    id: number
    thumbnailFile: string | null
}

export type IllustFilter = IllustQueryFilter & LimitAndOffsetFilter

export interface IllustQueryFilter {
    query?: string
    order?: OrderList<"id" | "score" | "orderTime" | "createTime" | "updateTime">
    type?: IllustType
    partition?: LocalDate
    favorite?: boolean
    topic?: number
    author?: number
}