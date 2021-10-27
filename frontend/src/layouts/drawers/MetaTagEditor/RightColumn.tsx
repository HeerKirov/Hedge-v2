import { defineComponent } from "vue"
import RightColumnMetaDatabase from "./RightColumnMetaDatabase"
import RightColumnSuggest from "./RightColumnSuggest"
import RightColumnRecent from "./RightColumnRecent"
import RightColumnSourceDerive from "./RightColumnSourceDerive"
import { installMetaDatabaseContext, usePanelContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        installMetaDatabaseContext()
        const { identity, rightColumnData: { tab }} = usePanelContext()

        return () => <div class={style.rightColumn}>
            <div class="m-1">
                <button class={`button is-${tab.value === "db" ? "link" : "white"} mr-1`} onClick={() => tab.value = "db"}>
                    <span class="icon"><i class="fa fa-database"/></span>
                    <span>元数据库</span>
                </button>
                <button class={`button is-${tab.value === "recent" ? "link" : "white"} mr-1`} onClick={() => tab.value = "recent"}>
                    <span class="icon"><i class="fa fa-history"/></span>
                    <span>最近使用</span>
                </button>
                <button class={`button is-${tab.value === "suggest" ? "link" : "white"} mr-1`} onClick={() => tab.value = "suggest"}>
                    <span class="icon"><i class="fa fa-adjust"/></span>
                    <span>相关推荐</span>
                </button>
                {identity.value?.type === "IMAGE" && <button class={`button is-${tab.value === "source" ? "link" : "white"}`} onClick={() => tab.value = "source"}>
                    <span class="icon"><i class="fa fa-file-invoice"/></span>
                    <span>来源推导</span>
                </button>}
            </div>
            {tab.value === "db"
                ? <RightColumnMetaDatabase/>
            : tab.value === "recent"
                ? <RightColumnRecent/>
            : tab.value === "suggest"
                ? <RightColumnSuggest/>
            : //source
                <RightColumnSourceDerive/>
            }
        </div>
    }
})
