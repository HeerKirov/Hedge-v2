import { HttpInstance, Response } from "@/functions/adapter-http"
import { SimpleIllust } from "@/functions/adapter-http/impl/illust"
import { datetime, LocalDateTime } from "@/utils/datetime"

export function createUtilIllustEndpoint(http: HttpInstance): UtilIllustEndpoint {
    return {
        getCollectionSituation: http.createDataRequest("/api/utils/meta/validate/tags", "POST", {
            parseResponse: (d) => (<any[]>d).map(mapToCollectionSituation)
        })
    }
}

function mapToCollectionSituation(data: any): CollectionSituation {
    return {
        id: <number>data["id"],
        childrenCount: <number>data["childrenCount"],
        orderTime: datetime.of(<string>data["orderTime"]),
        childrenExamples: <SimpleIllust[]>data["childrenExamples"],
        belongs: <number[]>data["belongs"]
    }
}

/**
 * 工具API：图像项目相关工具。
 */
export interface UtilIllustEndpoint {
    /**
     * 查询一组illust的集合所属情况，查询这些项目中的集合项/已经属于其他集合的项，给出这些集合的列表。
     */
    getCollectionSituation(tags: number[]): Promise<Response<CollectionSituation[]>>
}

export interface CollectionSituation {
    /**
     * 集合id。
     */
    id: number
    /**
     * 集合的子项目数量。
     */
    childrenCount: number
    /**
     * 集合的orderTime属性。
     */
    orderTime: LocalDateTime
    /**
     * 列出集合的一部分子项目作为示例。示例从头开始，因此第一项为封面。
     */
    childrenExamples: SimpleIllust[]
    /**
     * 调用API给出的列表中，有哪些id属于这个集合。
     */
    belongs: number[]
}
