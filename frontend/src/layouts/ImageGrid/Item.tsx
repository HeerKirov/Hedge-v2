import { defineComponent, inject, InjectionKey, PropType, Ref, ref, toRef } from "vue"

export type FitType = "cover" | "contain"

export const columnNumberInjection: InjectionKey<Ref<number>> = Symbol()

export const fitTypeInjection: InjectionKey<Ref<FitType>> = Symbol()

/**
 * 列表中的图片项。
 * 包装了一个显示单元所需的展示(图片本身，多图标记，选中标记)和行为(选定事件等)。
 */
export default defineComponent({
    props: {
        src: String,
        numTag: Number,
        column: Number,
        selected: {type: Boolean, default: false},
        fit: null as PropType<FitType>
    },
    emits: ["updateSelected"],
    setup(props, { emit }) {
        const columnNumber = props.column !== undefined ? toRef(props, 'column') : inject(columnNumberInjection, ref(4))
        const fit = props.fit !== undefined ? toRef(props, 'fit') : inject(fitTypeInjection, ref("cover" as FitType))

        const selected = toRef(props, 'selected')

        return () => {
            const layoutCSS = {
                "width": `${100 / columnNumber.value}%`,
                "padding": `${50 / columnNumber.value}% 0`
            }
            return <div class="v-image-item" style={layoutCSS}>
                <div class={selected.value ? "selected" : ""}>
                    <img src={props.src} style={{"objectFit": fit.value}}/>
                    {props.numTag && <span class="tag is-dark"><i class="fa fa-images mr-1"/><b>{props.numTag}</b></span>}
                </div>
            </div>
        }
    }
})