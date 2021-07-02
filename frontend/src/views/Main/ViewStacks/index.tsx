import { defineComponent, TransitionGroup } from "vue"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useViewStacks, installViewStacks, DetailViewInfo } from "./inject"
import ImageDetailView from "./ImageDetailView"
import style from "./style.module.scss"

export { useViewStacks, installViewStacks }

export default defineComponent({
    setup() {
        const { stacks } = useViewStacks()

        return () => <TransitionGroup enterFromClass={style.viewContainerEnterFrom}
                                      leaveToClass={style.viewContainerLeaveTo}
                                      enterActiveClass={style.viewContainerEnterActive}
                                      leaveActiveClass={style.viewContainerLeaveActive}>
            {stacks.value.map(mapView)}
        </TransitionGroup>
    }
})

const ViewContainer = defineComponent({
    props: {
        visible: Boolean
    },
    setup(props, { slots }) {
        watchGlobalKeyEvent(e => {
            //截断按键事件继续向前传播，使按键事件只能作用在最新的视图上
            e.stopPropagation()
        })

        //TODO 把cover遮罩动画移到这里实现
        //TODO 当view不是最上层时，在动画时间过后将其隐藏
        return () => <div class={style.viewContainer}>{slots.default?.()}</div>
    }
})

function mapView(page: DetailViewInfo, index: number, arr: DetailViewInfo[]) {
    const visible = index === arr.length - 1

    if(page.type === "image") {
        return <ViewContainer key={index} visible={visible}>
            <ImageDetailView data={page.data} currentIndex={page.currentIndex}/>
        </ViewContainer>
    }else{
        return undefined
    }
}
