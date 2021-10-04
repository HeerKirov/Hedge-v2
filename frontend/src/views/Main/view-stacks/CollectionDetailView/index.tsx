import { defineComponent, PropType } from "vue"
import MetaTagCallout, { installMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { installAddToCollectionDialog } from "@/layouts/dialogs/AddToCollectionDialog"
import SideLayout from "@/layouts/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { SingletonDataView } from "@/functions/utils/endpoints/query-endpoint"
import SideBarContent from "./SideBar/SideBarContent"
import MainContent from "./MainContent"
import { installPreviewContext } from "./inject"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<SingletonDataView<Illust>>, required: true}
    },
    emits: {
        toastRefresh: () => true
    },
    setup(props, { emit }) {
        installPreviewContext(props.data, () => emit("toastRefresh"))
        installMetaTagCallout()
        installAddToCollectionDialog()

        const sideLayoutSlots = {
            side() { return <SideBarContent/> },
            default() { return <MainContent/> }
        }
        return () => <>
            <SideLayout v-slots={sideLayoutSlots}/>
            <MetaTagCallout/>
        </>
    }
})
