import { defineComponent } from "vue"
import TopBarQueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    setup() {
        return () => <nav class="level">
        <div class="level-item">
            <div class="field is-grouped w-100 mx-6 pl-6 pr-3">
                <TopBarQueryBox/>
            </div>
        </div>
        <div class="level-right">
            <p class="control mr-2">
                <b class="is-size-7 line-height-24">80/1024项</b>
            </p>
            <p class="control mr-1">
                <button class="button no-drag is-small">
                    <i class="fa fa-lg fa-folder-plus mr-1"/>新建画集
                </button>
            </p>
            <p class="control">
                <button class="button no-drag is-small">
                    {/* album的视图尺寸比images更抽象，选项更少，根据media调整的密度也更高。 */}
                    <i class="fa fa-lg fa-th-large mr-2"/><b>大</b>
                </button>
            </p>
        </div>
    </nav>
    }
})