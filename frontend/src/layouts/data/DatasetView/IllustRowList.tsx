import { computed, defineComponent, inject, InjectionKey, PropType, provide, ref, Ref, toRef } from "vue"
import { VirtualRow } from "@/components/logicals/VirtualScrollView"
import { SourceInfo, TagmeInfo } from "@/layouts/displays"
import { installSettingSite } from "@/services/api/setting"
import { TypeDefinition } from "@/services/global/drag/definition"
import { PaginationData, QueryEndpointInstance } from "@/functions/endpoints/query-endpoint"
import type { SuitableIllust } from "./context"
import { datetime } from "@/utils/datetime"
import {
    SelectedCountBadge,
    useContentEvents, useDragEvents, useDropEvents, useKeyboardEvents, useSummaryDropEvents, useSelector
} from "./common"
import { InjectionContext, ItemImage } from "./common-row"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        /**
         * 分页数据视图。
         */
        data: {type: Object as PropType<PaginationData<SuitableIllust>>, required: true},
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
        const droppable = props.droppable !== undefined ? toRef(props, "droppable") as Ref<boolean> : undefined
        const drop = props.droppable !== undefined
            ? (insertIndex: number, illusts: TypeDefinition["illusts"], mode: "ADD" | "MOVE") => emit("dataDrop", insertIndex, illusts, mode)
            : undefined

        provide(contextInjection, {selected, lastSelected, data, queryEndpoint: props.queryEndpoint, draggable: props.draggable, droppable, drop, draggingFromLocal: ref(false)})

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illustId: number, option: boolean) => emit("dblClick", illustId, option)
        const enter = (illustId: number) => emit("enter", illustId)
        const rightClick = (illust: SuitableIllust) => emit("rightClick", illust)

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        return () => <div class={style.rowList}>
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
        const { data, queryEndpoint, selected, lastSelected, droppable, draggingFromLocal, drop } = inject(contextInjection)!

        installSettingSite()

        const selector = useSelector({
            queryEndpoint, data, selected, lastSelected,
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


        return () => <VirtualRow {...data.value.metrics} {...appendDropEvents}
                                  onUpdate={dataUpdate} bufferSize={6} minUpdateDelta={3} rowHeight={32}>
            {data.value.result.map((item, i) => <Item key={item.id}
                                                      index={data.value.metrics.offset + i} data={item}
                                                      onDblClick={dblClick} onRightClick={rightClick} onClick={click}/>)}
        </VirtualRow>
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

        function render(slot?: JSX.Element) {
            return <div class={{[style.item]: true, [style.illust]: true, [style.selected]: currentSelected.value}} onClick={click} onDblclick={dblClick} onContextmenu={rightClick} {...dragEvents}>
                <ItemImage thumbnailFile={props.data.thumbnailFile} type="illust" id={props.data.id}/>
                <div class={style.title}><b>{props.data.id}</b></div>
                <div class={style.childrenCount}>{props.data.childrenCount && <>
                    <i class="fa fa-images mr-2"/>
                    {props.data.childrenCount}项
                </>}</div>
                <div class={style.favorite}>{props.data.favorite && <i class="fa fa-heart has-text-danger"/>}</div>
                <div class={style.score}>{props.data.score && <>
                    <span>{props.data.score}</span>
                    <span class="icon ml-1"><i class="fa fa-star"/></span>
                </>}</div>
                <div class={style.tagme}>{(props.data.tagme.length || null) && <TagmeInfo value={props.data.tagme}/>}</div>
                <div class={style.source}>{props.data.type === "IMAGE" && <SourceInfo source={props.data.source} sourceId={props.data.sourceId} sourcePart={props.data.sourcePart}/>}</div>
                <div class={style.time}>{datetime.toSimpleFormat(props.data.orderTime)}</div>
                {slot}
            </div>
        }

        return dropEvents != null
            ? () => render(<>
                {dropEvents.isLeftDragover.value && <div class={style.leftDropTooltip}/>}
                {dropEvents.isRightDragover.value && <div class={style.rightDropTooltip}/>}
                <div class={style.leftTouch} {...dropEvents.leftDropEvents}/>
                <div class={style.rightTouch} {...dropEvents.rightDropEvents}/>
            </>)
            : () => render()
    }
})

const contextInjection: InjectionKey<InjectionContext<SuitableIllust, "illusts">> = Symbol()
