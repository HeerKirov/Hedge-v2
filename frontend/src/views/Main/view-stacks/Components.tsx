import { defineComponent, inject, InjectionKey, provide, ref, Ref, TransitionGroup } from "vue"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import style from "./style.module.scss"

export interface DefineViewStacksOptions<INFO, OPT extends object> {
    slots(info: INFO): JSX.Element | undefined
    operations(context: StacksContext<INFO>, stackIndex: number | undefined): OPT
}

export type ViewStacks<OPT extends object> = OPT & CommonOperations

interface CommonOperations {
    size(): number
    closeView(): void
    closeAll(): void
}

interface StacksContext<INFO> {
    stacks: Ref<INFO[]>
}

interface EachViewContext {
    stackIndex: number
}

export function defineViewStackComponents<INFO, OPT extends object>({ slots, operations }: DefineViewStacksOptions<INFO, OPT>) {
    const viewStacksInjection: InjectionKey<StacksContext<INFO>> = Symbol()

    const eachViewInjection: InjectionKey<EachViewContext> = Symbol()

    function mapViews<INFO>(pages: INFO[], slots: (_: INFO) => JSX.Element | undefined) {
        return pages.length <= 0 ? [] : [
            ...pages.slice(0, pages.length - 1).map((page, i) => containerDom(slots(page), i, true)),
            coverDom(pages.length),
            containerDom(slots(pages[pages.length - 1]), pages.length - 1, false)
        ]
    }

    function containerDom(slot: JSX.Element | undefined, index: number, hidden: boolean) {
        return slot && <ViewContainer key={index} stackIndex={index} hidden={hidden} v-slots={{default: () => slot}}/>
    }

    function coverDom(index: number) {
        return <div key={`background-cover-${index}`} class={style.viewBackgroundCover}/>
    }

    const ViewStack = defineComponent({
        setup() {
            const { stacks } = inject(viewStacksInjection)!

            return () => <TransitionGroup enterFromClass={style.transitionEnterFrom}
                                          leaveToClass={style.transitionLeaveTo}
                                          enterActiveClass={style.transitionEnterActive}
                                          leaveActiveClass={style.transitionLeaveActive}>
                {mapViews(stacks.value, slots)}
            </TransitionGroup>
        }
    })

    const ViewContainer = defineComponent({
        props: {
            stackIndex: {type: Number, required: true},
            hidden: Boolean
        },
        setup(props, { slots }) {
            provide(eachViewInjection, {stackIndex: props.stackIndex})

            watchGlobalKeyEvent(e => {
                //截断按键事件继续向前传播，使按键事件只能作用在最新的视图上
                e.stopPropagation()
            })

            return () => <div class={{[style.viewContainer]: true, [style.hidden]: props.hidden}}>{slots.default?.()}</div>
        }
    })

    function installViewStack(): ViewStacks<OPT> {
        const stacksContext: StacksContext<INFO> = {stacks: ref([])}
        provide(viewStacksInjection, stacksContext)
        return createViewStacksOperations(stacksContext, undefined)
    }

    function useViewStack(): ViewStacks<OPT> {
        const viewStacks = inject(viewStacksInjection)!
        const eachView = inject(eachViewInjection, () => null, true)
        return createViewStacksOperations(viewStacks, eachView?.stackIndex)
    }

    function createViewStacksOperations(stacksContext: StacksContext<INFO>, stackIndex: number | undefined): ViewStacks<OPT> {
        return {
            ...createCommonOperations(stacksContext, stackIndex),
            ...operations(stacksContext, stackIndex)
        }
    }

    function createCommonOperations({ stacks }: StacksContext<INFO>, stackIndex: number | undefined): CommonOperations {
        return {
            size() {
                return stacks.value.length
            },
            closeView() {
                if(stackIndex === undefined) {
                    if(stacks.value.length > 0) {
                        stacks.value.splice(stacks.value.length - 1, 1)
                    }
                }else{
                    stacks.value.splice(stackIndex, 1)
                }
            },
            closeAll() {
                stacks.value.splice(0, stacks.value.length)
            }
        }
    }

    return {ViewStack, installViewStack, useViewStack}
}



