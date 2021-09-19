import { ComponentPublicInstance, nextTick } from "vue"
import { sleep } from "@/utils/process"
import { ExpandedInfoContext } from "./inject-expand"

export interface ElementRefContext {
    /**
     * 将一个元素滚动到视野内。如果此元素被折叠，则先展开此元素的所有父元素。
     */
    scrollIntoView(key: number): void
    /**
     * 在节点元素载入后，将dom元素汇报到context统一管理。
     * 卸载时记得清空，不然会内存泄露。
     */
    setElement(key: number, el: Element | ComponentPublicInstance | null | undefined): void
}

export function useElementRefContext(expandedInfo: ExpandedInfoContext): ElementRefContext {
    const elements: Record<number, Element | ComponentPublicInstance | null> = {}

    let targetKey: number | null = null

    function scrollIntoView(el: Element | ComponentPublicInstance | null) {
        if(typeof (el as any).scrollIntoView === "function") {
            (el as any).scrollIntoView({block: "nearest"})
        }
    }

    return {
        scrollIntoView(key: number) {
            const el = elements[key]
            if(el) {
                //目前已经存在目标的ref，则直接采取操作
                nextTick(() => scrollIntoView(el)).finally()
            }else{
                //不存在目标的ref，则尝试展开目标的折叠，同时把target存起来，等待异步完成
                targetKey = key
                expandedInfo.setAllForParent(key, true)
            }
        },
        setElement(key: number, el: Element | ComponentPublicInstance | null | undefined) {
            if(el) {
                elements[key] = el
                if(targetKey === key) {
                    //目前存在操作目标，那么采取操作
                    nextTick(async () => {
                        targetKey = null
                        //sleep是等待是为了等待目标展开的动画结束。这是一个magic行为
                        await sleep(150)
                        scrollIntoView(el)
                    }).finally()
                }
            }else{
                delete elements[key]
            }
        }
    }
}
