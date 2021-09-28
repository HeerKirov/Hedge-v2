import { defineComponent, PropType } from "vue"
import MetaTagCallout, { installMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import SideLayout from "@/layouts/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import MainContent from "./MainContent"
import { installPreviewContext } from "./inject"
import { SingletonDataView } from "@/functions/utils/endpoints/query-endpoint"

export default defineComponent({
    props: {
        data: {type: Object as PropType<SingletonDataView<Illust>>, required: true}
    },
    setup(props) {
        installPreviewContext(props.data)
        installMetaTagCallout()

        const sideLayoutSlots = {
            side() { return undefined },
            default() { return <MainContent/> }
        }
        return () => <>
            <SideLayout v-slots={sideLayoutSlots}/>
            <MetaTagCallout/>
        </>
    }
})
