import { computed, defineComponent, inject, InjectionKey, PropType, provide, ref, Ref, toRef } from "vue"
import { VirtualGrid } from "@/components/features/VirtualScrollView"
import { TypeDefinition } from "@/functions/feature/drag/definition"
import { PaginationData, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import type { SuitableIllust } from "./context"
import {
    COLUMN_NUMBER_CLASS, FIT_TYPE_CLASS, FitType, SelectedCountBadge,
    useContentEvents, useDragEvents, useDropEvents, useKeyboardEvents, useSummaryDropEvents, useSelector
} from "./common"
import { InjectionContext, ItemImage, ItemNumTag, ItemFavIcon } from "./common-grid"
import style from "./style.module.scss"

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
         * 可拖拽开关。开启后，项可以被拖拽。
         */
        draggable: Boolean,
        /**
         * 可拖放开关。开启后，项可以被拖放illusts内容，并触发相应的drop事件。此外还有"末尾追加拖放区"。
         */
        droppable: {type: Boolean, default: undefined},
        /**
         * 显示右上角的选择计数角标。
         */
        showSelectCount: {type: Boolean, default: true}
    },
    emits: {
        dataUpdate: (_offset: number, _limit: number) => true,
        select: (_selected: number[], __lastSelected: number | null) => true,
        enter: (_id: number) => true,
        dblClick: (_id: number, __shift: boolean) => true,
        rightClick: (_id: unknown) => true,
        dataDrop: (_insertIndex: number | null, _illusts: TypeDefinition["illusts"], _mode: "ADD" | "MOVE") => true,
    },
    setup(props, { emit }) {
        const selected = toRef(props, "selected")
        const lastSelected = toRef(props, "lastSelected")
        const data = toRef(props, "data")
        const columnNum = toRef(props, "columnNum")
        const droppable = props.droppable !== undefined ? toRef(props, "droppable") as Ref<boolean> : undefined
        const drop = props.droppable !== undefined
            ? (insertIndex: number, illusts: TypeDefinition["illusts"], mode: "ADD" | "MOVE") => emit("dataDrop", insertIndex, illusts, mode)
            : undefined

        provide(contextInjection, {selected, lastSelected, data, columnNum, queryEndpoint: props.queryEndpoint, draggable: props.draggable, droppable, drop, draggingFromLocal: ref(false)})

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const enter = (illustId: number) => emit("enter", illustId)
        const rightClick = (illust: SuitableIllust) => emit("rightClick", illust)

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        return () => <div class={[style.grid, FIT_TYPE_CLASS[props.fitType], COLUMN_NUMBER_CLASS[props.columnNum]]}>
            <Content onDataUpdate={dataUpdate} onEnter={enter} onDblClick={dblClick} onRightClick={rightClick} onSelect={emitSelect}/>
            {props.showSelectCount && <SelectedCountBadge count={selected.value.length}/>}
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
        const { data, columnNum, queryEndpoint, selected, lastSelected, droppable, draggingFromLocal, drop } = inject(contextInjection)!

        const selector = useSelector({
            queryEndpoint, data, columnNum, selected, lastSelected,
            onEmit: (selected, lastSelected) => emit("select", selected, lastSelected)
        })

        const { dataUpdate, enter, dblClick, rightClick, click } = useContentEvents(selector, {
            dataUpdate: (_, __) => emit("dataUpdate", _, __),
            select: (_, __) => emit("select", _, __),
            enter: (_) => emit("enter", _),
            dblClick: (_, __) => emit("dblClick", _, __),
            rightClick: (_: SuitableIllust) => emit("rightClick", _)
        })

        useKeyboardEvents(selector, enter)

        const appendDropEvents = useSummaryDropEvents({
            droppable, draggingFromLocal,
            byType: "illusts",
            onDrop: drop
        })

        return () => <VirtualGrid {...data.value.metrics} {...appendDropEvents}
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
        const { draggable, droppable, selected, queryEndpoint, draggingFromLocal, drop } = inject(contextInjection)!

        const currentSelected = computed(() => selected.value.find(i => i === props.data.id) != undefined)

        const click = (e: MouseEvent) => emit("click", props.data, props.index, e)

        const dblClick = (e: MouseEvent) => {
            if(e.ctrlKey || e.shiftKey || e.metaKey) return
            emit("dblClick", props.data.id, e.altKey)
        }

        const rightClick = () => emit("rightClick", props.data)

        const dragEvents = useDragEvents({
            draggable, selected, queryEndpoint,
            byType: "illusts",
            dataRef: () => toRef(props, "data"),
            dataMap: illusts => illusts.map(illust => ({id: illust.id, type: illust.type ?? "IMAGE", thumbnailFile: illust.thumbnailFile, childrenCount: illust.childrenCount ?? null}))
        })
        const dropEvents = useDropEvents({
            droppable, draggingFromLocal,
            byType: "illusts",
            indexRef: () => toRef(props, "index"),
            onDrop: drop
        })

        return dropEvents !== null
            ? () => <div class={style.item} onClick={click} onDblclick={dblClick} onContextmenu={rightClick} {...dragEvents}>
                <ItemImage thumbnailFile={props.data.thumbnailFile} type={props.data.type} id={props.data.id}/>
                {currentSelected.value && <div class={style.selected}><div class={style.internalBorder}/></div>}
                {props.data.childrenCount && <ItemNumTag count={props.data.childrenCount}/>}
                {props.data.favorite && <ItemFavIcon/>}
                {dropEvents.isLeftDragover.value && <div class={style.leftDropTooltip}/>}
                {dropEvents.isRightDragover.value && <div class={style.rightDropTooltip}/>}
                <div class={style.leftTouch} {...dropEvents.leftDropEvents}/>
                <div class={style.rightTouch} {...dropEvents.rightDropEvents}/>
            </div>
            : () => <div class={style.item} onClick={click} onDblclick={dblClick} onContextmenu={rightClick} {...dragEvents}>
                <ItemImage thumbnailFile={props.data.thumbnailFile} type={props.data.type} id={props.data.id}/>
                <div class={{[style.touch]: true, [style.selected]: currentSelected.value}}><div class={style.internalBorder}/></div>
                {props.data.childrenCount && <ItemNumTag count={props.data.childrenCount}/>}
                {props.data.favorite && <ItemFavIcon/>}
            </div>
    }
})

const contextInjection: InjectionKey<InjectionContext<SuitableIllust, "illusts">> = Symbol()
