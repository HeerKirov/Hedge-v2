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

/* TODO 工作清单
 *  为了更好地实现illust列表传递，为DataEndpoint实现一个新功能，
 *      按照indexList映射一个符合DataEndpoint接口的代理对象，提供给detail view；
 *      这样便可统一detail view的数据输入，并且detail view的更改能传递回上层。
 *  完成顶栏UI/UX及实现
 *  完成Tag Editor模态框(大型工作)
 *  完成origin data编辑项，包括无相关数据时的初始化编辑
 *  添加Tag/orderTime等项的快捷操作
 *  添加Tag的弹出信息框
 *  添加一组快捷键用于切换侧边栏tab、缩放
 *  添加一个点击顶栏的data router，弹出的collection快速导航的功能
 */
