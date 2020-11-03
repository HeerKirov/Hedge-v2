import { defineComponent, inject, Ref, ref } from "vue"

/**
 * 分区视图的顶栏。
 */
export default defineComponent({
    setup() {
        return () => <div class="h-middle-layout absolute stretch">
            <div class="left">
                <button class="button no-drag is-small is-white mr-2"><span class="icon mr-2"><i class="fa fa-lg fa-angle-left"/></span>主题列表</button>
            </div>
            <div class="right">
                <p class="control mr-1">
                    <button class="button no-drag is-small">
                        <span class="icon"><i class="fa fa-heart has-text-danger"/></span>
                    </button>
                </p>
                <p class="control">
                    <button class="button no-drag is-small">
                        <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                    </button>
                </p>
            </div>
        </div>
    }
})
