import { defineComponent, PropType, toRef } from "vue"
import SideLayout from "@/components/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { SliceDataView } from "@/functions/endpoints/query-endpoint"
import SideBarContent from "./SideBar/SideBarContent"
import MainContent from "./MainContent"
import { installPreviewContext } from "./inject"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<SliceDataView<Illust>>, required: true},
        currentIndex: {type: Number, required: true}
    },
    emits: {
        updateCurrentIndex: (_: number) => true
    },
    setup(props, { emit }) {
        installPreviewContext(props.data, toRef(props, "currentIndex"), i => emit("updateCurrentIndex", i))

        const sideLayoutSlots = {
            side() { return <SideBarContent/> },
            default() { return <MainContent/> }
        }
        return () => <SideLayout v-slots={sideLayoutSlots}/>
    }
})
