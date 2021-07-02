import { defineComponent, PropType } from "vue"
import SideLayout from "@/layouts/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import SideBarContent from "./SideBarContent"
import MainContent from "./MainContent"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<QueryEndpointInstance<Illust> | number[]>, required: true},
        currentIndex: {type: Number, required: true}
    },
    setup(props) {


        const sideLayoutSlots = {
            side() { return <SideBarContent/> },
            default() { return <MainContent/> }
        }
        return () => <SideLayout v-slots={sideLayoutSlots}/>
    }
})
