import { defineComponent } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        showContent: {type: Boolean, default: true},
        showCloseButton: {type: Boolean, default: true},
        overflow: {type: Boolean, default: true}
    },
    emits: ["close"],
    setup(props, { slots, emit }) {
        return () => <div class={style.paneBasicLayout}>
            {props.showCloseButton && <button class="float-right square button is-white radius-circle mr-1" onClick={() => emit("close")}>
                <span class="icon"><i class="fa fa-times"/></span>
            </button>}
            <div class={{[style.mainContent]: true, [style.overflow]: props.overflow}}>
                {props.showContent && slots.default?.()}
            </div>
        </div>
    }
})
