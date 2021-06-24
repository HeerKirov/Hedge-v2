import { defineComponent } from "vue"
import TopBarLayout from "@/layouts/layouts/TopBarLayout"
import IllustGrid from "@/layouts/data/IllustGrid"
import TopBarContent from "./TopBarContent"
import { installIllustContext, useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        installIllustContext()

        return () => <TopBarLayout v-slots={{
            topBar: () => <TopBarContent/>,
            default: () => <ListView/>
        }}/>
    }
})

const ListView = defineComponent({
    setup() {
        const { endpoint, viewController: { fitType, columnNum } } = useIllustContext()

        return () => <IllustGrid data={endpoint.data.value} onDataUpdate={endpoint.dataUpdate}
                                 fitType={fitType.value} columnNum={columnNum.value}/>
    }
})
