import { computed, defineComponent, inject, InjectionKey, PropType, provide, Ref, toRef } from "vue"
import { useScrollView, VirtualGrid } from "@/components/features/VirtualScrollView"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { useToast } from "@/functions/module/toast"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import { PaginationData, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import { assetsUrl, useAppInfo } from "@/functions/app"
import { arrays } from "@/utils/collections"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        data: {type: Object as PropType<PaginationData<Illust>>, required: true},
        columnNum: {type: Number, default: 4},
        fitType: {type: String as PropType<FitType>, default: "cover"},
        selected: {type: Array as PropType<number[]>, default: []},
        lastSelected: {type: null as any as PropType<number | null>, default: null},
        queryEndpoint: Object as PropType<QueryEndpointInstance<Illust>>
    },
    emits: {
        dataUpdate: (_: number, __: number) => true,
        select: (_: number[], __: number | null) => true,
        enter: (_: number) => true,
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: Illust) => true
    },
    setup(props, { emit }) {
        const selected = toRef(props, "selected")
        const lastSelected = toRef(props, "lastSelected")

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const enter = (illustId: number) => emit("enter", illustId)
        const rightClick = (illust: Illust) => emit("rightClick", illust)

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        provide(selectContextInjection, {selected, lastSelected})

        return () => <div class={[style.root, FIT_TYPE_CLASS[props.fitType], COLUMN_NUMBER_CLASS[props.columnNum]]}>
            <Content data={props.data} columnNum={props.columnNum} queryEndpoint={props.queryEndpoint}
                     onDataUpdate={dataUpdate} onEnter={enter} onDblClick={dblClick} onRightClick={rightClick} onSelect={emitSelect}/>
            <OverLayer/>
        </div>
    }
})

const OverLayer = defineComponent({
    setup() {
        const { selected } = inject(selectContextInjection)!

        const selectedCount = computed(() => selected.value.length)

        return () => <div class={style.layer}>
            {selectedCount.value > 1 ? <div class={style.selectedCountTag}>已选择 {selectedCount.value} 项</div> : null}
        </div>
    }
})

const Content = defineComponent({
    props: {
        data: {type: Object as PropType<PaginationData<Illust>>, required: true},
        columnNum: {type: Number, required: true},
        queryEndpoint: Object as PropType<QueryEndpointInstance<Illust>>
    },
    emits: {
        dataUpdate: (_: number, __: number) => true,
        select: (_: number[], __: number | null) => true,
        enter: (_: number) => true,
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: Illust) => true
    },
    setup(props, { emit }) {
        const appInfo = useAppInfo()

        const columnNum = toRef(props, "columnNum")
        const data = toRef(props, "data")

        const selector = useSelector(data, columnNum, props.queryEndpoint, (selected, lastSelected) => emit("select", selected, lastSelected))

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)
        const enter = (illustId: number) => emit("enter", illustId)
        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const rightClick = (illust: Illust) => emit("rightClick", illust)
        const click = (illust: Illust, index: number, e: MouseEvent) => {
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
        data: {type: Object as PropType<Illust>, required: true},
        index: {type: Number, required: true}
    },
    emits: {
        dblClick: (_: number, __: boolean) => true,
        rightClick: (_: Illust) => true,
        click: (_: Illust, __: number, ___: MouseEvent) => true,
    },
    setup(props, { emit }) {
        const { selected } = inject(selectContextInjection)!

        const currentSelected = computed(() => selected.value.find(i => i === props.data.id) != undefined)

        const click = (e: MouseEvent) => emit("click", props.data, props.index, e)

        const dblClick = (e: MouseEvent) => {
            if(e.ctrlKey || e.shiftKey || e.metaKey) return
            emit("dblClick", props.data.id, e.altKey)
        }

        const rightClick = () => emit("rightClick", props.data)

        return () => <div class={style.item} onClick={click} onDblclick={dblClick} onContextmenu={rightClick}>
            <div class={style.content}>
                <img src={assetsUrl(props.data.thumbnailFile)} alt={`${props.data.type}-${props.data.id}`}/>
            </div>
            <div class={{[style.selected]: currentSelected.value, [style.touch]: true}}><div/></div>
            {props.data.childrenCount && <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{props.data.childrenCount}</span>}
            {props.data.favorite && <i class={[style.favTag, "fa", "fa-heart", "has-text-danger", "is-size-medium"]}/>}
        </div>
    }
})

function useSelector(data: Ref<PaginationData<Illust>>, columnNum: Ref<number>, queryEndpoint: QueryEndpointInstance<Illust> | undefined, emitSelectEvent: EmitSelectFunction) {
    const scrollView = useScrollView()
    const { toast } = useToast()
    const { selected, lastSelected } = inject(selectContextInjection)!

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

    async function getShiftSelectItems(queryEndpoint: QueryEndpointInstance<Illust>, selectId: number, lastSelectId: number) {
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

    async function getArrowSelectItem(queryEndpoint: QueryEndpointInstance<Illust>, lastSelectId: number, offset: number) {
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

    async function getOffsetSelectItem(queryEndpoint: QueryEndpointInstance<Illust>, index: number) {
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

export type FitType = "cover" | "contain"

type EmitSelectFunction = (selected: number[], lastSelected: number | null) => void

const selectContextInjection: InjectionKey<{selected: Ref<number[]>, lastSelected: Ref<number | null>}> = Symbol()

const FIT_TYPE_CLASS: {[key in FitType]: string} = {
    "cover": style.fitTypeCover,
    "contain": style.fitTypeContain
}

const COLUMN_MAX = 16
const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])

const SELECTED_MAX = 100
