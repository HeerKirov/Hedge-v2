import { defineComponent } from "vue"

/**
 * 一套用于左中右三段式布局的top-bar layout。中栏的左右间距恒定。
 */
export default defineComponent({
    setup(_, { slots }) {
        return () => <div id="middle-layout">
            <div class="v-left">
                {slots.left?.()}
            </div>
            <div class="v-middle">
                {slots.default?.()}
            </div>
            <div class="v-right">
                {slots.right?.()}
            </div>
        </div>
    }
})