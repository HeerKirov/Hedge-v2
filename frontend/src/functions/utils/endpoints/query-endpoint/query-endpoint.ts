import { shallowRef, Ref, watch, onUnmounted, onMounted } from "vue"
import { objects } from "@/utils/primitives"
import { createEmitter, Emitter } from "@/utils/emitter"
import { RefEmitter, useRefEmitter } from "@/functions/utils/emitter"
import { createQueryEndpointInstance, ModifiedEvent, QueryEndpointArguments, QueryEndpointInstance } from "./instance"

export interface QueryEndpointOptions<T, K> extends QueryEndpointArguments {
    /**
     * 响应式的查询条件对象。更新此对象会引发查询实例更换。
     */
    filter?: Ref<K>
    /**
     * 通过此函数回调数据源的查询结果。
     */
    request(offset: number, limit: number, filter: K): Promise<{ok: true, total: number, result: T[]} | {ok: false, message: string}>
}

export interface QueryEndpointResult<T> {
    /**
     * 代理实例。该对象的实现代理了真实对象，在只需要使用endpoint的API的情况下不需要手动处理instance更换引起的对象更替。
     */
    proxy: QueryEndpointInstance<T>
    /**
     * 当前响应式返回的实例。实例是浅响应的。
     */
    instance: Ref<QueryEndpointInstance<T>>
    /**
     * 将instance的syncOperations.modified代理为响应式事件。
     */
    modifiedEvent: RefEmitter<ModifiedEvent<T>>
    /**
     * 刷新。这会强制销毁重建实例以重新请求所有数据。
     */
    refresh(): void
}

export function useQueryEndpoint<T, K = undefined>(options: QueryEndpointOptions<T, K>): QueryEndpointResult<T> {
    const createInstance = (filter: K | undefined) => {
        const filterClone = filter !== undefined ? objects.deepCopy(filter) : undefined
        return createQueryEndpointInstance({
            request: (offset, limit) => options.request(offset, limit, filterClone as K),
            handleError: options.handleError,
            segmentSize: options.segmentSize
        })
    }

    const instance: Ref<QueryEndpointInstance<T>> = shallowRef(createInstance(options.filter?.value))

    const { modified, modifiedEvent} = useModifiedEvent<T>()

    const { refresh } = useInstanceChange<T, K>(instance, options.filter, createInstance, modified.emit)

    const proxy = useProxyObject(instance, modified)

    return {proxy, instance, modifiedEvent, refresh}
}

function useModifiedEvent<T>() {
    const modified = createEmitter<ModifiedEvent<T>>()
    const modifiedEvent = useRefEmitter<ModifiedEvent<T>>()

    onMounted(() => modified.addEventListener(modifiedEvent.emit))
    onUnmounted(() => modified.removeEventListener(modifiedEvent.emit))

    return {modified, modifiedEvent}
}

function useInstanceChange<T, K>(instance: Ref<QueryEndpointInstance<T>>, filter: Ref<K> | undefined, createInstance: (filter: K | undefined) => QueryEndpointInstance<T>, modified: (arg: ModifiedEvent<T>) => void) {
    const changeInstance = (filter: K | undefined) => {
        //移除旧实例时要移除代理事件
        instance.value.syncOperations.modified.removeEventListener(modified)
        //创建新实例
        instance.value = createInstance(filter)
        //创建新实例时再加入代理事件
        instance.value.syncOperations.modified.addEventListener(modified)
    }
    const refresh = () => changeInstance(filter?.value)
    if(filter !== undefined) watch(filter, changeInstance, {deep: true})

    return {refresh}
}

function useProxyObject<T>(instance: Ref<QueryEndpointInstance<T>>, modified: Emitter<ModifiedEvent<T>>): QueryEndpointInstance<T> {
    return {
        queryOne: index => instance.value.queryOne(index),
        queryRange: (offset, limit) => instance.value.queryRange(offset, limit),
        queryList: indexList => instance.value.queryList(indexList),
        isRangeLoaded: (offset, limit) => instance.value.isRangeLoaded(offset, limit),
        count: () => instance.value.count(),
        syncOperations: {
            find: (condition, priorityRange) => instance.value.syncOperations.find(condition, priorityRange),
            retrieve: index => instance.value.syncOperations.retrieve(index),
            modify: (index, newData) => instance.value.syncOperations.modify(index, newData),
            remove: index => instance.value.syncOperations.remove(index),
            modified
        }
    }
}
