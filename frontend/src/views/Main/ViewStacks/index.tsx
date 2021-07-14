import { defineComponent, TransitionGroup } from "vue"
import { watchGlobalKeyEvent } from "@/functions/document/global-key"
import { useViewStacks, installViewStacks, DetailViewInfo } from "./inject"
import ImageDetailView from "./ImageDetailView"
import BackspaceButton from "./BackspaceButton"
import style from "./style.module.scss"

export { useViewStacks, installViewStacks, BackspaceButton }

export default defineComponent({
    setup() {
        const { stacks } = useViewStacks()

        return () => <TransitionGroup enterFromClass={style.transitionEnterFrom}
                                      leaveToClass={style.transitionLeaveTo}
                                      enterActiveClass={style.transitionEnterActive}
                                      leaveActiveClass={style.transitionLeaveActive}>
            {mapViews(stacks.value)}
        </TransitionGroup>
    }
})

const ViewContainer = defineComponent({
    props: {
        hidden: Boolean
    },
    setup(props, { slots }) {
        watchGlobalKeyEvent(e => {
            //截断按键事件继续向前传播，使按键事件只能作用在最新的视图上
            e.stopPropagation()
        })

        return () => <div class={{[style.viewContainer]: true, [style.hidden]: props.hidden}}>{slots.default?.()}</div>
    }
})

function mapViews(pages: DetailViewInfo[]) {
    if(pages.length <= 0) {
        return []
    }
    return pages.slice(0, pages.length - 1).map((page, i) => mapView(page, i, true))
        .concat(coverDom(pages.length), mapView(pages[pages.length - 1], pages.length - 1, false))
}

function mapView(page: DetailViewInfo, index: number, hidden: boolean) {
    if(page.type === "image") {
        return <ViewContainer key={index} hidden={hidden}>
            <ImageDetailView data={page.data} currentIndex={page.currentIndex}/>
        </ViewContainer>
    }else{
        return undefined
    }
}

function coverDom(index: number) {
    return <div key={`background-cover-${index}`} class={style.viewBackgroundCover}/>
}
