import { defineComponent, PropType, ref, watch } from "vue"
import { VirtualGrid } from "@/components/features/VirtualScrollView"
import { ListEndpointData } from "@/functions/utils/endpoints/list-endpoint"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { assetsUrl } from "@/functions/app"
import { arrays } from "@/utils/collections"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        data: {type: Object as PropType<ListEndpointData<Illust>>, required: true},
        columnNum: {type: Number, default: 4},
        fitType: {type: String as PropType<FitType>, default: "cover"}
    },
    emits: ["dataUpdate"],
    setup(props, { emit }) {
        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        return () => <div class={[style.root, FIT_TYPE_CLASS[props.fitType], COLUMN_NUMBER_CLASS[props.columnNum]]}>
            <Content data={props.data} columnNum={props.columnNum} onDataUpdate={dataUpdate}/>
        </div>
    }
})

const Content = defineComponent({
    props: {
        data: {type: Object as PropType<ListEndpointData<Illust>>, required: true},
        columnNum: {type: Number, required: true}
    },
    emits: ["dataUpdate"],
    setup(props, { emit }) {
        const dataUpdate = (offset: number, limit: number) => emit("dataUpdate", offset, limit)

        return () => <VirtualGrid {...props.data.metrics}
                                  onUpdate={dataUpdate} columnCount={props.columnNum}
                                  bufferSize={5} minUpdateDelta={1} padding={2}>
            {props.data.result.map(item => <Item key={item.id} data={item}/>)}
        </VirtualGrid>
    }
})

const Item = defineComponent({
    props: {
        data: {type: Object as PropType<Illust>, required: true}
    },
    setup(props) {
        const selected = ref(false)

        return () => <div class={style.item} onClick={() => selected.value = !selected.value} onDblclick={() => console.log("dbl click")}>
            <div class={style.content}>
                <img src={assetsUrl(props.data.thumbnailFile)} alt={`${props.data.type}-${props.data.id}`}/>
            </div>
            <div class={{[style.selected]: selected.value, [style.touch]: true}}><div/></div>
            {props.data.childrenCount && <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{props.data.childrenCount}</span>}
            {props.data.favorite && <i class={[style.favTag, "fa", "fa-heart", "has-text-danger", "is-size-medium"]}/>}
        </div>
    }
})

export type FitType = "cover" | "contain"

const FIT_TYPE_CLASS: {[key in FitType]: string} = {
    "cover": style.fitTypeCover,
    "contain": style.fitTypeContain
}

const COLUMN_MAX = 16
const COLUMN_NUMBER_CLASS = arrays.newArray(COLUMN_MAX + 1, i => style[`columnNum${i}`])
