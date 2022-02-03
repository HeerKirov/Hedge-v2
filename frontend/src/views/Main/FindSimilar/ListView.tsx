import { defineComponent, PropType } from "vue"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { FindSimilarResult } from "@/functions/adapter-http/impl/find-similar"
import { assetsUrl } from "@/functions/app"
import { useFindSimilarContext } from "./inject"
import style from "./style.module.scss"
import { usePopupMenu } from "@/functions/module/popup-menu";

export default defineComponent({
    setup() {
        const { list: { endpoint, dataView } } = useFindSimilarContext()

        const menu = useContextmenu()

        return () => dataView.data.value.metrics.total !== undefined && dataView.data.value.metrics.total <= 0 ? <EmptyContent/>
            : <div class="w-100 h-100">
                <VirtualRow rowHeight={80} padding={{top: 6, bottom: 0, left: 12, right: 12}} bufferSize={10} onUpdate={dataView.dataUpdate} {...dataView.data.value.metrics}>
                    {dataView.data.value.result.map(item => <Item key={item.id} value={item} onRightClick={() => menu.popup(item)}/>)}
                </VirtualRow>
            </div>
    }
})

const EmptyContent = defineComponent({
    setup() {
        return () => <div class="w-100 h-100 has-text-centered relative">
            <p class="has-text-grey"><i>没有任何暂存导入项目</i></p>
        </div>
    }
})

const Item = defineComponent({
    props: {
        value: {type: Object as PropType<FindSimilarResult>, required: true}
    },
    emits: {
        rightClick: () => true
    },
    setup(props, { emit }) {
        const rightClick = () => emit("rightClick")

        return () => <div class={[style.item, "box"]} onContextmenu={rightClick}>
            <div class={style.left}>
                {props.value.images.map(image => <img class={style.img} src={assetsUrl(image.thumbnailFile)} alt={`example ${image.id}`}/>)}
            </div>
        </div>
    }
})

function useContextmenu() {
    const menu = usePopupMenu<FindSimilarResult>(() => [
        { type: "normal", label: "显示详情并处理" },
        { type: "separator" },
        { type: "normal", label: "删除此结果" },
        { type: "normal", label: "忽略此结果" },
    ])

    return menu
}
