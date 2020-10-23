import { defineComponent } from "vue"

/**
 * 一套用于左中右三段式布局的top-bar layout。中栏的左右间距恒定。
 */
export default defineComponent({
    setup(_, { slots }) {
        return () => <div class="h-middle-layout absolute stretch">
            <div class="left">
                {slots.left?.()}
            </div>
            <div class="middle">
                {slots.default?.()}
            </div>
            <div class="right">
                {slots.right?.()}
            </div>
        </div>
    }
})