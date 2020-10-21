import { defineComponent, inject, Ref, ref } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 画集的顶栏。
 */
export default defineComponent({
    setup() {
        return () => <MiddleLayout>
            {{
                left: () => <>
                    <button class="button is-small is-white mr-2"><span class="icon"><i class="fa fa-lg fa-angle-left"/></span></button>
                    <b>这是标题</b>
                </>,
                right: () => <>
                    <p class="control mr-2">
                        <b class="is-size-7 line-height-24">80/1024项</b>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-heart has-text-danger"/></span>
                        </button>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-lg fa-info-circle has-text-link"/></span>
                        </button>
                    </p>
                    <TopBarViewController/>
                </>
            }}
        </MiddleLayout>
    }
})
