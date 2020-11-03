import { defineComponent, inject, Ref, ref } from "vue"
import QueryBox from "../../TopBar/QueryBox"
import TopBarViewController from "../../TopBar/ViewController"

/**
 * 分区视图的顶栏。
 */
export default defineComponent({
    setup() {
        const queryInCollection = ref(true)

        const changeQueryInCollection = () => {
            queryInCollection.value = !queryInCollection.value
        }

        return () => <div class="h-middle-layout absolute stretch">
            <div class="left">
                <button class="button is-small is-white mr-2"><span class="icon"><i class="fa fa-lg fa-angle-left"/></span></button>
                <b>2020年10月</b>
            </div>
            <div class="middle">
                <div class="field is-grouped">
                    <p class="control mr-2">
                        <button class="button no-drag is-small rounded-50" onClick={changeQueryInCollection}>
                            <span class="icon"><i class={`fa fa-lg fa-${queryInCollection.value ? "images" : "file-image"}`}/></span>
                        </button>
                    </p>
                    <QueryBox placeholder="使用hedge QL查询"/>
                </div>
            </div>
            <div class="right">
                <p class="control mr-2">
                    <b class="is-size-7 line-height-24">80/1024项</b>
                </p>
                <TopBarViewController/>
            </div>
        </div>
    }
})
