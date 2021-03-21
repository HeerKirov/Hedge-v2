

type OrderPrefix = "" | "+" | "-"

export type OrderList<T extends string> = `${OrderPrefix}${T}`

export interface LimitAndOffsetFilter {
    limit?: number
    offset?: number
}

export interface IdResponse {
    id: number
}

export interface ListResult<T> {
    total: number
    result: T[]
}

export interface Link {
    title: string
    link: string
}