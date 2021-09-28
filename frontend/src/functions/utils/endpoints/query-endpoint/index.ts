/**
 * 此处提供一整套多层次的、为响应式条件和虚拟滚动查询设计的、带有缓存的分页查询API。
 * 它的层次自下而上分为如下几层。
 * - 针对单个查询条件生成的查询端点实例，也就是一个查询条件持有一个不变的instance。此举有助于上层解耦和将实例提供给其他位置引用。
 * - 针对响应式查询条件，响应式返回查询端点实例的VCA。
 * - 针对虚拟查询条件，响应式返回分页内容数据的VCA。
 * 此外还有附加工具：
 * - SliceDataView: 从实例中代理一个切片，映射数据列表以及对数据列表的sync operations。
 */

export { usePaginationDataView } from "./pagination-data-view"
export { useQueryEndpoint } from "./query-endpoint"
export { createQueryEndpointInstance } from "./instance"
export { createSliceOfAll, createSliceOfList } from "./slice-data-view"
export { createSingletonOfOne } from "./singleton-data-view"
export type { PaginationDataView, PaginationData } from "./pagination-data-view"
export type { QueryEndpointResult, QueryEndpointOptions } from "./query-endpoint"
export type { QueryEndpointInstance, QueryEndpointInstanceOptions, SyncOperations } from "./instance"
export type { SliceDataView } from "./slice-data-view"
export type { SingletonDataView } from "./singleton-data-view"
