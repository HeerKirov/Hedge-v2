import { ref, Ref } from "vue"
import { arrays } from "@/utils/collections"

/* 此处提供了VCA形态的缓存型数据分页查询端点。
 * 它将数据分段缓存以减少查询压力，并将并发查询统一处理。
 */

interface DataEndpointOptions<T> {
    /**
     * 根据offset和limit取数据。结果可异步返回。此函数应该直接对接查询API。
     */
    request(offset: number, limit: number): Promise<{ok: true, total: number, result: T[]} | {ok: false, message: string}>
    /**
     * 数据段大小。段指在内部实现中将数据平均切割后的一份，用于优化数据整体查询。
     */
    segmentSize: number
    /**
     * 查询延时。在提交真实查询后，延时多久以执行查询。用于节流，优化查询频次。延时对初次查询无效。
     */
    queryDelay: number
}

interface DataEndpointResult<T> {
    data: Ref<DataEndpointData<T>>
    dataUpdate(offset: number, limit: number): void
    refresh(): void
}

interface DataEndpointData<T> {
    metrics: {
        total: number | undefined,
        offset: number,
        limit: number
    }
    result: T[]
}

export function useDataEndpoint<T>({ request, segmentSize, queryDelay }: DataEndpointOptions<T>): DataEndpointResult<T> {
    const queryQueue = useQueryQueue(request, queryDelay)
    const segments = useSegments(segmentSize, queryQueue)

    let nextQueryId = 1

    const data: Ref<DataEndpointData<T>> = ref({
        metrics: {total: undefined, offset: 0, limit: 0},
        result: []
    })
    const dataUpdate = async (offset: number, limit: number) => {
        const queryId = nextQueryId++
        const ok = await segments.query(queryId, offset, limit)
        if(ok) {
            //ok表示数据可用
            const result: T[] = queryQueue.data.buffer.slice(offset, offset + limit)
            data.value = {
                metrics: {total: queryQueue.data.total ?? undefined, offset, limit: result.length},
                result
            }
        }
    }
    const refresh = () => {
        queryQueue.clear()
        segments.clear()
        data.value = {metrics: {total: undefined, offset: 0, limit: 0}, result: []}
    }

    return {data, dataUpdate, refresh}
}

function useSegments(segmentSize: number, queryQueue: ReturnType<typeof useQueryQueue>) {
    let segments: Segment[] = []

    const query = (queryId: number, offset: number, limit: number): Promise<boolean> => {
        //计算出正确的范围，避免超出总量，导致出现不应该出现的segment
        const beginItem = offset < 0 ? 0 : queryQueue.data.total != null && offset > queryQueue.data.total ? queryQueue.data.total : offset
        const endItem = offset + limit < 0 ? 0 : queryQueue.data.total != null && offset + limit > queryQueue.data.total ? queryQueue.data.total : offset + limit
        //计算segment的范围
        const begin = Math.floor(beginItem / segmentSize), end = Math.ceil(endItem / segmentSize)

        let leaveSegment = end - begin
        let isResolved = false

        return new Promise<boolean>(resolve => {
            const segmentCallback = (ok: boolean) => {
                if(!isResolved) {
                    if(ok) {
                        //如果回调是true，表示当前的segment已经准备完成，使leave数量减1
                        leaveSegment -= 1
                        if(leaveSegment <= 0) {
                            //数量减少到0表示所有segment都已经准备完成，可以完成总回调
                            isResolved = true
                            resolve(true)
                        }
                    }else{
                        //如果回调是false，表示因为error或cancel，此次查询应当被取消，那么直接返回，不再等待所有回调完成
                        isResolved = true
                        resolve(false)
                    }
                }
            }

            //处于not loaded状态，需要发起一次请求的段
            const requiredSegments: Segment[] = []

            for(let i = begin; i < end; ++i) {
                let segment = segments[i]
                if(!segment || segment.status === SegmentStatus.NOT_LOADED) {
                    //对于not loaded的segment，将其放入请求队列，并注册回调
                    if(!segment) {
                        segments[i] = segment = createSegment(i)
                    }
                    requiredSegments.push(segment)
                    segment.callbacks = [segmentCallback]
                }else if(segment.status === SegmentStatus.LOADING) {
                    //对于loading的segment，注册回调
                    segment.callbacks.push(segmentCallback)
                }else{
                    //对于loaded的段，直接调用回调结果
                    leaveSegment -= 1
                }
            }

            //将需要请求的segment按照连续性分割成数个分片
            const splits = arrays.split(requiredSegments, (a, b) => b.index - a.index > 1)
            for (const split of splits) {
                //计算出每个分片的数据范围
                const offset = split[0].index * segmentSize, limit = (split[split.length - 1].index + 1) * segmentSize - offset
                //发起查询请求
                queryQueue.query(queryId, offset, limit, queryCallback(queryId, createSegmentSnapshot(split)))
            }

            if(leaveSegment <= 0) {
                //如果发现剩余的segment已经为0，则直接回调
                isResolved = true
                resolve(true)
            }
        })
    }

    const queryCallback = (queryId: number, snapshot: SegmentSnapshot) => (status: QueryCallback) => {
        //请求的回调
        if(status === QueryCallback.QUERYING) {
            //状态变更为querying，相关的segment状态都设定为loading
            snapshot.setStatus(SegmentStatus.LOADING)
        }else if(status === QueryCallback.OK) {
            //状态变更为ok，相关的segment状态都设定为loaded，向snapshot回调true
            snapshot.setStatus(SegmentStatus.LOADED)
            snapshot.callback(true)
        }else if(status === QueryCallback.ERROR) {
            //出现error状态，向snapshot回调false，并重置segment回not loaded
            snapshot.setStatus(SegmentStatus.NOT_LOADED)
            snapshot.callback(false)
        }else{
            //canceled，向snapshot回调false，不变更segment
            snapshot.callback(false)
        }
    }

    const clear = () => {
        for (let segment of segments) {
            for (const callback of segment.callbacks) {
                callback(false)
            }
            segment.callbacks = []
        }
        segments = []
    }

    function createSegment(index: number) {
        return {
            index,
            status: SegmentStatus.NOT_LOADED,
            callbacks: []
        }
    }

    function createSegmentSnapshot(segments: Segment[]): SegmentSnapshot {
        const callbacks = segments.map(segment => segment.callbacks)
        return {
            setStatus(status: SegmentStatus) {
                for (const segment of segments) {
                    segment.status = status
                }
            },
            callback(ok: boolean) {
                for (const callback of callbacks) {
                    for (const one of callback) {
                        one(ok)
                    }
                    callback.splice(0, callback.length)
                }
            }
        }
    }

    return {query, clear}
}

function useQueryQueue<T>(request: DataEndpointOptions<T>["request"], queryDelay: number) {
    const data = <{buffer: T[], total: number | null}>{
        buffer: [],
        total: null
    }

    let current: QueryInfoGroup | null = null

    const query = (queryId: number, offset: number, limit: number, callback: (status: QueryCallback) => void) => {
        if(current?.queryId === queryId) {
            //两次查询拥有相同的queryId时，它们将会并发执行，而不是重置计时器
            current.queue.push([offset, limit, callback])
        }else{
            //两次查询拥有不同的queryId时，将会丢弃上次的查询
            if(current != null) {
                clearTimeout(current.timer)
                for (const [, , callback] of current.queue) {
                    callback(QueryCallback.CANCELED)
                }
            }
            //total为null可以判定为初次查询，此时没有延时，立即加载数据
            const delay = data.total != null ? queryDelay : 0
            const group = current = {
                queryId,
                queue: [[offset, limit, callback]],
                timer: setTimeout(async () => {
                    current = null
                    for (const [, , callback] of group.queue) {
                        callback(QueryCallback.QUERYING)
                    }
                    for await (const [offset, limit, callback] of group.queue) {
                        const res = await request(offset, limit)
                        if(res.ok) {
                            data.total = res.total
                            for(let i = 0; i < res.result.length; ++i) {
                                data.buffer[offset + i] = res.result[i]
                            }
                            callback(QueryCallback.OK)
                        }else{
                            //TODO 调用notification通知错误
                            callback(QueryCallback.ERROR)
                        }
                    }
                }, delay)
            }
        }
    }

    const clear = () => {
        data.buffer = []
        data.total = null
    }

    return {data, query, clear}
}

enum SegmentStatus {
    NOT_LOADED,
    LOADING,
    LOADED
}

enum QueryCallback {
    CANCELED,
    QUERYING,
    OK,
    ERROR
}

interface Segment {
    index: number
    status: SegmentStatus
    callbacks: ((ok: boolean) => void)[]
}

interface SegmentSnapshot {
    setStatus(status: SegmentStatus)
    callback(ok: boolean)
}

interface QueryInfoGroup {
    queryId: number
    queue: [number, number, (status: QueryCallback) => void][]
    timer: number
}