import { defineComponent, inject, InjectionKey, provide, ref, Ref, TransitionGroup, watch } from "vue"
import { useRoute } from "vue-router"
import { watchGlobalKeyEvent } from "@/functions/feature/keyboard"
import style from "./style.module.scss"

export interface DefineViewStacksOptions<INFO, OPT extends object = {}> {
    slots(info: INFO): JSX.Element | undefined
    operations?(context: StacksOperationContext<INFO>, stackIndex: number | undefined): OPT
    onClose?(info: INFO)
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

interface StacksOperationContext<INFO> {
    stacks: Readonly<Ref<INFO[]>>
    push(info: INFO): void
    close(info: INFO): void
}

interface EachViewContext {
    stackIndex: number
}

export function defineViewStackComponents<INFO, OPT extends object>({ slots, operations, onClose }: DefineViewStacksOptions<INFO, OPT>) {
    const viewStacksInjection: InjectionKey<StacksContext<INFO>> = Symbol()

    const eachViewInjection: InjectionKey<EachViewContext> = Symbol()

    function mapViews(pages: INFO[]) {
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
                {mapViews(stacks.value)}
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

        const route = useRoute()
        watch(() => route.name, () => {
            //路由发生变化时，清空栈区
            const pops = stacksContext.stacks.value.splice(0, stacksContext.stacks.value.length)
            if(onClose) pops.forEach(onClose)
        })

        return createViewStacksOperations(stacksContext, undefined)
    }

    function useViewStack(): ViewStacks<OPT> {
        const viewStacks = inject(viewStacksInjection)!
        const eachView = inject(eachViewInjection, () => null, true)
        return createViewStacksOperations(viewStacks, eachView?.stackIndex)
    }

    function createViewStacksOperations(stacksContext: StacksContext<INFO>, stackIndex: number | undefined): ViewStacks<OPT> {
        const stackOperationContext: StacksOperationContext<INFO> = {
            stacks: stacksContext.stacks,
            push(info: INFO) {
                stacksContext.stacks.value.push(info)
            },
            close(info: INFO) {
                const index = stacksContext.stacks.value.findIndex(i => i === info)
                if(index >= 0) {
                    const pops = stacksContext.stacks.value.splice(index, 1)
                    if(onClose) pops.forEach(onClose)
                }
            }
        }
        return {
            ...createCommonOperations(stacksContext, stackIndex),
            ...(operations?.(stackOperationContext, stackIndex) ?? ({} as OPT))
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
                        const pops = stacks.value.splice(stacks.value.length - 1, 1)
                        if(onClose) pops.forEach(onClose)
                    }
                }else{
                    const pops = stacks.value.splice(stackIndex, 1)
                    if(onClose) pops.forEach(onClose)
                }
            },
            closeAll() {
                const pops = stacks.value.splice(0, stacks.value.length)
                if(onClose) pops.forEach(onClose)
            }
        }
    }

    return {ViewStack, installViewStack, useViewStack}
}



