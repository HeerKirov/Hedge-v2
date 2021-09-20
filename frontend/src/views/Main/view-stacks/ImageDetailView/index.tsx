import { defineComponent, PropType, toRef } from "vue"
import MetaTagCallout, { installMetaTagCallout } from "@/layouts/data/MetaTagCallout"
import SideLayout from "@/layouts/layouts/SideLayout"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { SliceDataView } from "@/functions/utils/endpoints/query-endpoint"
import SideBarContent from "./SideBar/SideBarContent"
import MainContent from "./MainContent"
import { installDetailViewContext } from "./inject"

export default defineComponent({
    props: {
        data: {type: null as any as PropType<SliceDataView<Illust>>, required: true},
        currentIndex: {type: Number, required: true}
    },
    setup(props) {
        installDetailViewContext(props.data, toRef(props, "currentIndex"))
        installMetaTagCallout()

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

/* TODO 工作清单
 *  完成origin data编辑项
 *  添加Tag的弹出信息框
 */
