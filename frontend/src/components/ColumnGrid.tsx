import { computed, defineComponent } from "vue"
import style from "./ColumnGrid.module.scss"

/**
 * 具有一定特殊性质的flex布局。其列数固定，且每个单元格的长宽比固定不变。
 */
export default defineComponent({
    props: {
        column: {type: Number, default: 8}
    },
    setup(props, { slots }) {
        const widthStyle = computed(() => ({
            width: `${100 / props.column}%`,
            padding: `${50 / props.column}% 0`
        }))

        return () => {
            const subItems = slots.default?.()?.map(vnode => <div class={style.item} style={widthStyle.value}>
                <div class={style.content}>
                    {vnode}
                </div>
            </div>)
            return <div class={style.grid}>
                {subItems}
            </div>
        }
    }
})