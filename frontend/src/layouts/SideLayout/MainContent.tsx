import { defineComponent } from "vue"
import style from "./style.module.scss"

/**
 * 一个包装区域，简单地包装了除了topBar之外剩余的区域，同时提供滚动。
 */
export default defineComponent({
    setup(_, { slots }) {
        return () => <div class={style.mainContent}>
            {slots.default?.()}
        </div>
    }
})