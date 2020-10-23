import { defineComponent } from "vue"
import MiddleLayout from "../../TopBar/MiddleLayout"
import QueryBox from "../../TopBar/QueryBox"

export default defineComponent({
    setup() {
        return () => <MiddleLayout>
            {{
                default: () => <QueryBox placeholder="使用hedge QL查询画集"/>,
                right: () => <>
                    <p class="control mr-2">
                        <b class="is-size-7 line-height-24">80/1024项</b>
                    </p>
                    <p class="control mr-1">
                        <button class="button no-drag is-small">
                            <span class="icon"><i class="fa fa-folder-plus"/></span>
                        </button>
                    </p>
                    <p class="control">
                        <button class="button no-drag is-small">
                            {/* album的视图尺寸比images更抽象，选项更少，根据media调整的密度也更高。 */}
                            <i class="fa fa-lg fa-th-large mr-2"/><b>大</b>
                        </button>
                    </p>
                </>
            }}
        </MiddleLayout>
    }
})