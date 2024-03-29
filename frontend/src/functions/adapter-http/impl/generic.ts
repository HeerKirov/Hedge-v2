

type OrderPrefix = "" | "+" | "-"
type OrderListItem<T extends string> = `${OrderPrefix}${T}`
export type OrderList<T extends string> = OrderListItem<T> | OrderListItem<T>[]

export type MetaType = "TOPIC" | "AUTHOR" | "TAG"

export type IdentityType = "IMAGE" | "COLLECTION" | "ALBUM"

export interface LimitFilter {
    limit?: number
}

export interface LimitAndOffsetFilter extends LimitFilter {
    offset?: number
}

export interface IdResponse {
    id: number
}

export interface IdResponseWithWarnings extends IdResponse {
    warnings: ErrorResult[]
}

export interface ListResult<T> {
    total: number
    result: T[]
}

export interface ErrorResult {
    code: string
    message: string | null
    info: any
}

export interface Link {
    title: string
    link: string
}


export function mapFromOrderList(orderList: OrderList<string> | null | undefined): string | undefined {
    return orderList == null ? undefined : typeof orderList === "object" ? (orderList.length ? orderList.join(",") : undefined) : orderList
}
