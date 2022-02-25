import { computed, Ref } from "vue"
import { PaginationData, QueryEndpointInstance } from "@/functions/endpoints/query-endpoint"
import { TypeDefinition } from "@/services/global/drag/definition"
import { clientPlatform } from "@/functions/adapter-ipc"
import { useDraggable, useDroppable } from "@/services/global/drag"
import { watchGlobalKeyEvent } from "@/services/global/keyboard"
import { useToast } from "@/services/module/toast"
import { useScrollView } from "@/components/logicals/VirtualScrollView"
import { arrays } from "@/utils/collections"
import style from "./style.module.scss"

const SELECTED_MAX = 256

export type FitType = "cover" | "contain"

export const FIT_TYPE_CLASS: {[key in FitType]: string} = {
    "cover": style.fitTypeCover,
    "contain": style.fitTypeContain
}

const COLUMN_MAX = 16
export const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])

export function SelectedCountBadge(props: {count: number}) {
    return props.count > 1 ? <div class={style.selectedCountTag}>已选择 {props.count} 项</div> : null
}

interface EmitContext<T extends {id: number}> {
    dataUpdate(_: number, __: number)
    select(_: number[], __: number | null)
    enter(_: number)
    dblClick(_: number, __: boolean)
    rightClick(_: T)
}

export interface Selector {
    select(index: number, illustId: number): void
    appendSelect(index: number, illustId: number): void
    shiftSelect(index: number, illustId: number): Promise<void>
    moveSelect(arrow: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", shift: boolean): Promise<void>
    lastSelected: Ref<number | null>
    selected: Ref<number[]>
}

interface SelectorOptions<T extends {id: number}> {
    queryEndpoint: QueryEndpointInstance<T> | undefined
    data: Ref<PaginationData<T>>
    selected: Ref<number[]>
    lastSelected: Ref<number | null>
    columnNum?: Ref<number> | number
    onEmit(selected: number[], lastSelected: number | null): void
}

export function useSelector<T extends {id: number}>(options: SelectorOptions<T>): Selector {
    const scrollView = useScrollView()
    const { toast } = useToast()
    const { selected, lastSelected, queryEndpoint, data, columnNum, onEmit } = options

    const select = (index: number, illustId: number) => {
        // 单击一个项时，如果没有选择此项，则取消所有选择项，只选择此项；否则无动作
        if(!selected.value.includes(illustId)) {
            onEmit([illustId], illustId)
        }
    }

    const appendSelect = (index: number, illustId: number) => {
        // 按住CTRL/CMD单击一个项时，如果没有选择此项，则将此项加入选择列表；否则将此项从选择列表移除
        const find = selected.value.findIndex(i => i === illustId)
        if(find >= 0) {
            onEmit([...selected.value.slice(0, find), ...selected.value.slice(find + 1)], null)
        }else{
            if(selected.value.length + 1 > SELECTED_MAX) {
                toast("选择上限", "warning", `选择的数量超过上限: 最多可选择${SELECTED_MAX}项。`)
                return
            }
            onEmit([...selected.value, illustId], illustId)
        }
    }

    const shiftSelect = async (index: number, illustId: number) => {
        // 按住SHIFT单击一个项时，
        // - 如果没有last selected(等价于没有选择项)，则选择此项；
        // - 如果last selected不是自己，那么将从自己到last selected之间的所有项加入选择列表；否则无动作
        if(lastSelected.value === null) {
            onEmit([illustId], illustId)
        }else if(lastSelected.value !== illustId) {
            if(queryEndpoint !== undefined) {
                const result = await getShiftSelectItems(queryEndpoint, illustId, lastSelected.value)
                if(result === null) {
                    toast("选择失败", "warning", "内部错误: 无法正确获取选择项。")
                    return
                }
                const ret: number[] = []
                for(const id of selected.value) {
                    if(!result.includes(id)) {
                        ret.push(id)
                    }
                }
                ret.push(...result)

                if(ret.length > SELECTED_MAX) {
                    toast("选择上限", "warning", `选择的数量超过上限: 最多可选择${SELECTED_MAX}项。`)
                    return
                }
                onEmit(ret, illustId)
            }
        }
    }

    const moveSelect = async (arrow: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight", shift: boolean) => {
        if(queryEndpoint !== undefined) {
            if(lastSelected.value === null) {
                //在未选择任何选项时，根据scrollView得知当前显示范围内的上下界，并作为选择项
                const index = arrow === "ArrowLeft" || arrow === "ArrowUp" ? scrollView.state.itemOffset : (scrollView.state.itemOffset + scrollView.state.itemLimit - 1)
                const illustId = await getOffsetSelectItem(queryEndpoint, index)
                if(illustId !== null) {
                    onEmit([illustId], illustId)
                    scrollView.navigateTo(index)
                }
            }else{
                const offset = getMoveOffset(arrow)
                const result = await getArrowSelectItem(queryEndpoint, lastSelected.value, offset)
                if (result !== null) {
                    if(shift) {
                        await shiftSelect(result.index, result.illustId)
                    }else{
                        onEmit([result.illustId], result.illustId)
                        scrollView.navigateTo(result.index)
                    }
                }
            }
        }
    }

    const getMoveOffset: (arrow: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight") => number
        = columnNum === undefined ? (arrow => arrow === "ArrowLeft" || arrow === "ArrowUp" ? -1 : 1)
        : typeof columnNum === "number" ? (arrow => arrow === "ArrowLeft" ? -1 : arrow === "ArrowRight" ? 1 : arrow === "ArrowUp" ? -columnNum : columnNum)
        : (arrow => arrow === "ArrowLeft" ? -1 : arrow === "ArrowRight" ? 1 : arrow === "ArrowUp" ? -columnNum.value : columnNum.value)

    async function getShiftSelectItems(queryEndpoint: QueryEndpointInstance<T>, selectId: number, lastSelectId: number) {
        const priorityRange: [number, number] = [data.value.metrics.offset, data.value.metrics.offset + data.value.metrics.limit]
        const index1 = queryEndpoint.syncOperations.find(i => i.id === selectId, priorityRange)
        const index2 = queryEndpoint.syncOperations.find(i => i.id === lastSelectId, priorityRange)
        if(index1 === undefined || index2 === undefined) {
            return null
        }
        if(index1 <= index2) {
            return (await queryEndpoint.queryRange(index1, index2 - index1 + 1)).map(i => i.id)
        }else{
            return (await queryEndpoint.queryRange(index2, index1 - index2 + 1)).map(i => i.id)
        }
    }

    async function getArrowSelectItem(queryEndpoint: QueryEndpointInstance<T>, lastSelectId: number, offset: number) {
        const priorityRange: [number, number] = [data.value.metrics.offset, data.value.metrics.offset + data.value.metrics.limit]
        const lastIndex = queryEndpoint.syncOperations.find(i => i.id === lastSelectId, priorityRange)
        if(lastIndex === undefined) return null
        const index = lastIndex + offset
        const count = queryEndpoint.count()
        if(index < 0 || (count !== null && index >= count)) return null
        const res = await queryEndpoint.queryOne(index)
        if(res === undefined) return null
        return {illustId: res.id, index}
    }

    async function getOffsetSelectItem(queryEndpoint: QueryEndpointInstance<T>, index: number) {
        return (await queryEndpoint.queryOne(index))?.id ?? null
    }

    return {select, appendSelect, shiftSelect, moveSelect, lastSelected, selected}
}

export function useKeyboardEvents({ moveSelect, lastSelected }: Selector, enter: (illustId: number) => void) {
    watchGlobalKeyEvent(e => {
        if(e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
            moveSelect(e.key, e.shiftKey).finally()
            e.stopPropagation()
            e.preventDefault()
        }else if(e.key === "Enter") {
            if(lastSelected.value !== null) {
                enter(lastSelected.value)
            }
            e.stopPropagation()
            e.preventDefault()
        }
    })
}

export function useDragEvents<T extends keyof TypeDefinition, DATA extends {id: number}>(options: {
    draggable: boolean
    selected: Ref<number[]>
    queryEndpoint: QueryEndpointInstance<DATA> | undefined
    byType: T
    dataRef(): Ref<DATA>
    dataMap(item: DATA[]): TypeDefinition[T]
}) {
    const { draggable, queryEndpoint, selected, byType, dataMap, dataRef } = options

    if(draggable && queryEndpoint !== undefined) {
        const data = dataRef()
        const dragEvents = useDraggable(byType, () => {
            //拖曳行为：与context的复数选择行为一致。当拖曳项是选择项时，拖曳全部选择项；不是时，仅拖曳拖曳项。
            if(selected.value.includes(data.value.id)) {
                const d = selected.value.map(illustId => {
                    if(illustId !== data.value.id) {
                        const index = queryEndpoint.syncOperations.find(i => i.id === illustId)
                        if(index !== undefined) {
                            return queryEndpoint.syncOperations.retrieve(index)!
                        }else{
                            return null
                        }
                    }else{
                        return data.value
                    }
                }).filter(i => i !== null) as DATA[]
                return dataMap(d)
            }else{
                return dataMap([data.value])
            }
        })
        return {...dragEvents, draggable: true}
    }else{
        return {}
    }
}

export function useDropEvents<T extends keyof TypeDefinition>(options: {
    droppable: Ref<boolean> | undefined
    draggingFromLocal: Ref<boolean>
    byType: T
    indexRef(): Ref<number>
    onDrop?(insertIndex: number | null, illusts: TypeDefinition[T], mode: "ADD" | "MOVE"): void
}) {
    const { droppable, draggingFromLocal, byType, onDrop, indexRef } = options

    if(droppable !== undefined) {
        const index = indexRef()

        const { isDragover: leftDragover, ...leftDropEvents } = useDroppable(byType, illusts => {
            if(droppable.value) {
                onDrop!(index.value, illusts, draggingFromLocal.value ? "MOVE" : "ADD")
            }
        }, {stopPropagation: true})
        const { isDragover: rightDragover, ...rightDropEvents } = useDroppable(byType, illusts => {
            if(droppable.value) {
                onDrop!(index.value + 1, illusts, draggingFromLocal.value ? "MOVE" : "ADD")
            }
        }, {stopPropagation: true})
        const isLeftDragover = computed(() => leftDragover.value && droppable.value)
        const isRightDragover = computed(() => rightDragover.value && droppable.value)

        return {isLeftDragover, isRightDragover, leftDropEvents, rightDropEvents}
    }else{
        return null
    }
}

export function useSummaryDropEvents<T extends keyof TypeDefinition>(options: {
    droppable: Ref<boolean> | undefined
    draggingFromLocal: Ref<boolean>
    byType: T
    onDrop?(insertIndex: number | null, illusts: TypeDefinition[T], mode: "ADD" | "MOVE"): void
}) {
    const { droppable, draggingFromLocal, byType, onDrop } = options
    if(droppable !== undefined) {
        const { isDragover, ...dropEvents } = useDroppable(byType, illusts => {
            if(droppable.value) {
                onDrop!(null, illusts, draggingFromLocal.value ? "MOVE" : "ADD")
            }
        })

        const onDragstart = () => draggingFromLocal.value = true
        const onDragend = () => draggingFromLocal.value = false

        return {...dropEvents, onDragstart, onDragend}
    }else{
        return null
    }
}

export function useContentEvents<T extends {id: number}>(selector: Selector, emit: EmitContext<T>) {
    const dataUpdate = (offset: number, limit: number) => emit.dataUpdate(offset, limit)
    const enter = (imageId: number) => emit.enter(imageId)
    const dblClick = (imageId: number, option: boolean) => emit.dblClick(imageId, option)
    const rightClick = (obj: T) => emit.rightClick(obj)
    const click = (obj: T, index: number, e: MouseEvent) => {
        // 追加添加的任意选择项都会排列在选择列表的最后
        // 选择任意项都会使其成为last selected
        // 为了性能考虑，选择的项数上限为100
        if(e.shiftKey) {
            selector.shiftSelect(index, obj.id).finally()
        }else if((e.metaKey && clientPlatform === "darwin") || (e.ctrlKey && clientPlatform !== "darwin")) {
            selector.appendSelect(index, obj.id)
        }else{
            selector.select(index, obj.id)
        }
    }

    return {dataUpdate, enter, dblClick, rightClick, click}
}
