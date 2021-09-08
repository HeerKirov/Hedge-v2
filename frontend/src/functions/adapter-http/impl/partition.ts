import { HttpInstance, Response } from "../server"
import { LimitAndOffsetFilter } from "./generic"
import { date, LocalDate } from "@/utils/datetime"

export function createPartitionEndpoint(http: HttpInstance): PartitionEndpoint {
    return {
        list: http.createQueryRequest("/api/partitions", "GET", {
            parseResponse: d => (<any[]>d).map(mapToPartition)
        }),
        get: http.createPathRequest(d => `/api/partitions/${date.toISOString(d)}`, "GET", {
            parseResponse: mapToPartition
        })
    }
}

function mapToPartition(data: any): Partition {
    return {
        date: date.of(<string>data["date"]),
        count: <number>data["count"]
    }
}

/**
 * 分区。
 */
export interface PartitionEndpoint {
    /**
     * 查询分区列表。
     */
    list(filter: PartitionFilter): Promise<Response<Partition[]>>
    /**
     * 查看分区。
     * @exception NOT_FOUND
     */
    get(id: LocalDate): Promise<Response<Partition>>
}

export interface Partition {
    date: LocalDate
    count: number
}

export interface PartitionFilter extends LimitAndOffsetFilter {
    gte?: LocalDate
    lt?: LocalDate
}
