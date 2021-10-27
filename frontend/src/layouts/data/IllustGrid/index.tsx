import { computed, defineComponent, inject, InjectionKey, PropType, provide, Ref, toRef } from "vue"
import { useScrollView, VirtualGrid } from "@/components/features/VirtualScrollView"
import { useToast } from "@/functions/module/toast"
import { useDraggable } from "@/functions/feature/drag"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import { PaginationData, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import { assetsUrl, useAppInfo } from "@/functions/app"
import { arrays } from "@/utils/collections"
import { useGridContextOperator } from "./context"
import type { SuitableIllust, GridContextOperatorResult } from "./context"
import style from "./style.module.scss"

export { useGridContextOperator, GridContextOperatorResult }

export default defineComponent({
    props: {
        /**
         * 分页数据视图。
         */
        data: {type: Object as PropType<PaginationData<SuitableIllust>>, required: true},
        /**
         * 显示的列数。
         */
        columnNum: {type: Number, default: 4},
        /**
         * 内容填充的方式。cover表示裁切并填满整个方块，contain表示留白并完整显示所有内容。
         */
        fitType: {type: String as PropType<FitType>, default: "cover"},
        /**
         * 选择器：已选择项列表。
         */
        selected: {type: Array as PropType<number[]>, default: []},
        /**
         * 选择器：上一个已选择项。
         */
        lastSelected: {type: null as any as PropType<number | null>, default: null},
        /**
         * 数据查询端点。被选择器用到了。
         */
        queryEndpoint: Object as PropType<QueryEndpointInstance<SuitableIllust>>,
        /**
         * 可拖拽开关。
         */
        draggable: Boolean
    },
    emits: {
        dataUpdate: (_: number, __: number) => true,
        select: (_: number[], __: number | null) => true,
        enter: (_: number) => true,
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: unknown) => true
    },
    setup(props, { emit }) {
        const selected = toRef(props, "selected")
        const lastSelected = toRef(props, "lastSelected")
        const data = toRef(props, "data")
        const columnNum = toRef(props, "columnNum")

        provide(contextInjection, {selected, lastSelected, data, columnNum, queryEndpoint: props.queryEndpoint, draggable: props.draggable})

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const enter = (illustId: number) => emit("enter", illustId)
        const rightClick = (illust: SuitableIllust) => emit("rightClick", illust)

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        return () => <div class={[style.root, FIT_TYPE_CLASS[props.fitType], COLUMN_NUMBER_CLASS[props.columnNum]]}>
            <Content onDataUpdate={dataUpdate} onEnter={enter} onDblClick={dblClick} onRightClick={rightClick} onSelect={emitSelect}/>
            <OverLayer/>
        </div>
    }
})

const OverLayer = defineComponent({
    setup() {
        const { selected } = inject(contextInjection)!

        const selectedCount = computed(() => selected.value.length)

        return () => <div class={style.layer}>
            {selectedCount.value > 1 ? <div class={style.selectedCountTag}>已选择 {selectedCount.value} 项</div> : null}
        </div>
    }
})

const Content = defineComponent({
    emits: {
        dataUpdate: (_: number, __: number) => true,
        select: (_: number[], __: number | null) => true,
        enter: (_: number) => true,
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: SuitableIllust) => true
    },
    setup(props, { emit }) {
        const appInfo = useAppInfo()
        const { data, columnNum } = inject(contextInjection)!

        const selector = useSelector((selected, lastSelected) => emit("select", selected, lastSelected))

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)
        const enter = (illustId: number) => emit("enter", illustId)
        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const rightClick = (illust: SuitableIllust) => emit("rightClick", illust)
        const click = (illust: SuitableIllust, index: number, e: MouseEvent) => {
            // 追加添加的任意选择项都会排列在选择列表的最后
            // 选择任意项都会使其成为last selected
            // 为了性能考虑，选择的项数上限为100
            if(e.shiftKey) {
                selector.shiftSelect(index, illust.id).finally()
            }else if((e.metaKey && appInfo.platform === "darwin") || (e.ctrlKey && appInfo.platform !== "darwin")) {
                selector.appendSelect(index, illust.id)
            }else{
                selector.select(index, illust.id)
            }
        }

        useKeyboardEvents(selector, enter)

        return () => <VirtualGrid {...data.value.metrics}
                                  onUpdate={dataUpdate} columnCount={columnNum.value}
                                  bufferSize={5} minUpdateDelta={1} padding={{top: 1, bottom: 1, left: 2, right: 2}}>
            {data.value.result.map((item, i) => <Item key={item.id}
                                                      index={data.value.metrics.offset + i} data={item}
                                                      onDblClick={dblClick} onRightClick={rightClick} onClick={click}/>)}
        </VirtualGrid>
    }
})

const Item = defineComponent({
    props: {
        data: {type: Object as PropType<SuitableIllust>, required: true},
        index: {type: Number, required: true}
    },
    emits: {
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: SuitableIllust) => true,
        click: (_: SuitableIllust, __: number, ___: MouseEvent) => true,
    },
    setup(props, { emit }) {
        const { selected } = inject(contextInjection)!

        const currentSelected = computed(() => selected.value.find(i => i === props.data.id) != undefined)

        const click = (e: MouseEvent) => emit("click", props.data, props.index, e)

        const dblClick = (e: MouseEvent) => {
            if(e.ctrlKey || e.shiftKey || e.metaKey) return
            emit("dblClick", props.data.id, e.altKey)
        }

        const rightClick = () => emit("rightClick", props.data)

        const dragEvents = useDragEvents(() => toRef(props, "data"))

        return () => <div class={style.item} onClick={click} onDblclick={dblClick} onContextmenu={rightClick} draggable={true} {...dragEvents}>
            <div class={style.content}>
                <img src={assetsUrl(props.data.thumbnailFile)} alt={`${props.data.type}-${props.data.id}`}/>
            </div>
            <div class={{[style.selected]: currentSelected.value, [style.touch]: true}}><div/></div>
            {props.data.childrenCount && <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{props.data.childrenCount}</span>}
            {props.data.favorite && <i class={[style.favTag, "fa", "fa-heart", "has-text-danger", "is-size-medium"]}/>}
        </div>
    }
})

function useSelector(emitSelectEvent: EmitSelectFunction) {
    const scrollView = useScrollView()
    const { toast } = useToast()
    const { selected, lastSelected, queryEndpoint, data, columnNum } = inject(contextInjection)!

    const select = (index: number, illustId: number) => {
        // 单击一个项时，如果没有选择此项，则取消所有选择项，只选择此项；否则无动作
        if(!selected.value.includes(illustId)) {
            emitSelectEvent([illustId], illustId)
        }
    }

    const appendSelect = (index: number, illustId: number) => {
        // 按住CTRL/CMD单击一个项时，如果没有选择此项，则将此项加入选择列表；否则将此项从选择列表移除
        const find = selected.value.findIndex(i => i === illustId);
        if(find >= 0) {
            emitSelectEvent([...selected.value.slice(0, find), ...selected.value.slice(find + 1)], null)
        }else{
            if(selected.value.length + 1 > SELECTED_MAX) {
                toast("选择上限", "warning", `选择的数量超过上限: 最多可选择${SELECTED_MAX}项。`)
                return
            }
            emitSelectEvent([...selected.value, illustId], illustId)
        }
    }

    const shiftSelect = async (index: number, illustId: number) => {
        // 按住SHIFT单击一个项时，
        // - 如果没有last selected(等价于没有选择项)，则选择此项；
        // - 如果last selected不是自己，那么将从自己到last selected之间的所有项加入选择列表；否则无动作
        if(lastSelected.value === null) {
            emitSelectEvent([illustId], illustId)
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
                emitSelectEvent(ret, illustId)
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
                    emitSelectEvent([illustId], illustId)
                    scrollView.navigateTo(index)
                }
            }else{
                const offset = arrow === "ArrowLeft" ? -1 : arrow === "ArrowRight" ? 1 : arrow === "ArrowUp" ? -columnNum.value : columnNum.value
                const result = await getArrowSelectItem(queryEndpoint, lastSelected.value, offset)
                if (result !== null) {
                    if(shift) {
                        await shiftSelect(result.index, result.illustId)
                    }else{
                        emitSelectEvent([result.illustId], result.illustId)
                        scrollView.navigateTo(result.index)
                    }
                }
            }
        }
    }

    async function getShiftSelectItems(queryEndpoint: QueryEndpointInstance<SuitableIllust>, selectId: number, lastSelectId: number) {
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

    async function getArrowSelectItem(queryEndpoint: QueryEndpointInstance<SuitableIllust>, lastSelectId: number, offset: number) {
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

    async function getOffsetSelectItem(queryEndpoint: QueryEndpointInstance<SuitableIllust>, index: number) {
        return (await queryEndpoint.queryOne(index))?.id ?? null
    }

    return {select, appendSelect, shiftSelect, moveSelect, lastSelected, selected}
}

function useKeyboardEvents({ moveSelect, lastSelected }: ReturnType<typeof useSelector>, enter: (illustId: number) => void) {
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

function useDragEvents(getDataRef: () => Ref<SuitableIllust>) {
    const { draggable, selected, queryEndpoint } = inject(contextInjection)!

    if(draggable && queryEndpoint !== undefined) {
        const data = getDataRef()
        return useDraggable("illusts", () => {
            const selectedItems = selected.value.length <= 0 ? [] : selected.value.map(illustId => {
                const index = queryEndpoint.syncOperations.find(i => i.id === illustId)!
                const illust = queryEndpoint.syncOperations.retrieve(index)!
                return {id: illust.id, type: illust.type ?? "IMAGE", thumbnailFile: illust.thumbnailFile, childrenCount: illust.childrenCount ?? null}
            })
            const clickItems = selected.value.includes(data.value.id) ? [] : [{id: data.value.id, type: data.value.type ?? "IMAGE", thumbnailFile: data.value.thumbnailFile, childrenCount: data.value.childrenCount ?? null}]

            return selectedItems.concat(clickItems)
        })
    }else{
        return {}
    }
}

export type FitType = "cover" | "contain"

type EmitSelectFunction = (selected: number[], lastSelected: number | null) => void

interface Context {
    queryEndpoint: QueryEndpointInstance<SuitableIllust> | undefined
    data: Ref<PaginationData<SuitableIllust>>
    selected: Ref<number[]>
    lastSelected: Ref<number | null>
    columnNum: Ref<number>
    draggable: boolean
}

const contextInjection: InjectionKey<Context> = Symbol()

const FIT_TYPE_CLASS: {[key in FitType]: string} = {
    "cover": style.fitTypeCover,
    "contain": style.fitTypeContain
}

const COLUMN_MAX = 16
const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])

const SELECTED_MAX = 256
