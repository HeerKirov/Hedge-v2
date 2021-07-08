import { defineComponent, PropType, toRef } from "vue"
import SideLayout from "@/layouts/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import SideBarContent from "./SideBarContent"
import MainContent from "./MainContent"
import { installDetailViewContext } from "./inject"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<QueryEndpointInstance<Illust> | Illust[]>, required: true},
        currentIndex: {type: Number, required: true}
    },
    setup(props) {
        installDetailViewContext(props.data, toRef(props, "currentIndex"))

        const sideLayoutSlots = {
            side() { return <SideBarContent/> },
            default() { return <MainContent/> }
        }
        return () => <SideLayout v-slots={sideLayoutSlots}/>
    }
})
