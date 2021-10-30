import { defineComponent, PropType } from "vue"
import SideLayout from "@/layouts/layouts/SideLayout"
import MetaTagCallout, { installMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import { CreatingCollectionDialog, installCreatingCollectionDialog } from "@/layouts/dialogs/CreatingCollectionDialog"
import { SingletonDataView } from "@/functions/utils/endpoints/query-endpoint"
import { Album } from "@/functions/adapter-http/impl/album"
import SideBarContent from "./SideBarContent"
import MainContent from "./MainContent"
import { installPreviewContext } from "./inject"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<SingletonDataView<Album>>, required: true}
    },
    emits: {
        toastRefresh: () => true
    },
    setup(props, { emit }) {
        installPreviewContext(props.data, () => emit("toastRefresh"))
        installMetaTagCallout()
        installCreatingCollectionDialog()

        const sideLayoutSlots = {
            side() { return <SideBarContent/> },
            default() { return <MainContent/> }
        }
        return () => <>
            <SideLayout v-slots={sideLayoutSlots}/>
            <MetaTagCallout/>
            <CreatingCollectionDialog/>
        </>
    }
})