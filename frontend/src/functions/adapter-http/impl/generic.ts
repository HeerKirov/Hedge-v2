

type OrderPrefix = "" | "+" | "-"
type OrderListItem<T extends string> = `${OrderPrefix}${T}`
export type OrderList<T extends string> = OrderListItem<T> | OrderListItem<T>[]

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

export function mapFromOrderList(orderList: OrderList<string> | null | undefined): string | undefined {
    return orderList == null ? undefined : typeof orderList === "object" ? (orderList.length ? orderList.join(",") : undefined) : orderList
}
