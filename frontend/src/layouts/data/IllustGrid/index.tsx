import { computed, defineComponent, inject, InjectionKey, PropType, provide, Ref, ref, toRef } from "vue"
import { VirtualGrid } from "@/components/features/VirtualScrollView"
import { ListEndpointData } from "@/functions/utils/endpoints/list-endpoint"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { assetsUrl, useAppInfo } from "@/functions/app"
import { arrays } from "@/utils/collections"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        data: {type: Object as PropType<ListEndpointData<Illust>>, required: true},
        columnNum: {type: Number, default: 4},
        fitType: {type: String as PropType<FitType>, default: "cover"},
        selected: {type: Array as PropType<number[]>, default: []},
        lastSelected: {type: null as any as PropType<number | null>, default: null}
    },
    emits: ["dataUpdate", "select", "dblClick", "rightClick"],
    setup(props, { emit }) {
        const selected = toRef(props, "selected")
        const lastSelected = toRef(props, "lastSelected")

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illust: Illust) => emit("dblClick", illust)

        const rightClick = (illust: Illust) => emit("rightClick", illust)

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        provide(selectContextInjection, {selected, lastSelected})

        return () => <div class={[style.root, FIT_TYPE_CLASS[props.fitType], COLUMN_NUMBER_CLASS[props.columnNum]]}>
            <Content data={props.data} columnNum={props.columnNum} onDataUpdate={dataUpdate} onDblClick={dblClick} onRightClick={rightClick} onSelect={emitSelect}/>
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
        data: {type: Object as PropType<ListEndpointData<Illust>>, required: true},
        columnNum: {type: Number, required: true}
    },
    emits: ["dataUpdate", "dblClick", "rightClick", "select"],
    setup(props, { emit }) {
        const appInfo = useAppInfo()

        const { selected, lastSelected } = inject(selectContextInjection)!

        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        const dblClick = (illust: Illust) => emit("dblClick", illust)

        const rightClick = (illust: Illust) => emit("rightClick", illust)

        const click = (illust: Illust, index: number, e: MouseEvent) => {
            // 追加添加的任意选择项都会排列在选择列表的最后
            // 选择任意项都会使其成为last selected
            // TODO 为了性能考虑，选择的项数上限为100
            if(e.shiftKey) {
                // 按住SHIFT单击一个项时，
                // - 如果没有last selected(等价于没有选择项)，则选择此项；
                // - 如果last selected不是自己，那么将从自己到last selected之间的所有项加入选择列表；否则无动作
                if(lastSelected.value === null) {
                    const last = illust.id
                    emitSelect([last], last)
                }else if(lastSelected.value !== illust.id) {
                    //TODO shift select
                }
            }else if((e.metaKey && appInfo.platform === "darwin") || (e.ctrlKey && appInfo.platform !== "darwin")) {
                // 按住CTRL/CMD单击一个项时，如果没有选择此项，则将此项加入选择列表；否则将此项从选择列表移除
                const find = selected.value.findIndex(i => i === illust.id);
                if(find >= 0) {
                    emitSelect([...selected.value.slice(0, find), ...selected.value.slice(find + 1)], null)
                }else{
                    const last = illust.id
                    emitSelect([...selected.value, last], last)
                }
            }else{
                // 单击一个项时，如果没有选择此项，则取消所有选择项，只选择此项；否则无动作
                if(!selected.value.includes(illust.id)) {
                    const last = illust.id
                    emitSelect([last], last)
                }
            }
        }

        const emitSelect = (selected: number[], lastSelected: number | null) => emit("select", selected, lastSelected)

        return () => <VirtualGrid {...props.data.metrics}
                                  onUpdate={dataUpdate} columnCount={props.columnNum}
                                  bufferSize={5} minUpdateDelta={1} padding={2}>
            {props.data.result.map((item, i) => <Item key={item.id}
                                                      index={props.data.metrics.offset + i} data={item}
                                                      onDblClick={dblClick} onRightClick={rightClick} onClick={click}/>)}
        </VirtualGrid>
    }
})

const Item = defineComponent({
    props: {
        data: {type: Object as PropType<Illust>, required: true},
        index: {type: Number, required: true}
    },
    emits: ["dblClick", "rightClick", "click", "shiftSelect"],
    setup(props, { emit }) {

        const { selected } = inject(selectContextInjection)!

        const currentSelected = computed(() => selected.value.find(i => i === props.data.id) != undefined)

        const click = (e: MouseEvent) => emit("click", props.data, props.index, e)

        const dblClick = () => emit("dblClick", props.data)

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

export type FitType = "cover" | "contain"

const selectContextInjection: InjectionKey<{selected: Ref<number[]>, lastSelected: Ref<number | null>}> = Symbol()

const FIT_TYPE_CLASS: {[key in FitType]: string} = {
    "cover": style.fitTypeCover,
    "contain": style.fitTypeContain
}

const COLUMN_MAX = 16
const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])
