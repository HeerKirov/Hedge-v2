import { defineComponent } from "vue"
import { SimpleIllust } from "@/functions/adapter-http/impl/illust"
import { useDialogServiceContext } from "../all"

export interface CloneImageContext {
    /**
     * 打开一个对话框，执行图像关系克隆操作。
     * 可以预先指定from和to，也可以都不指定，在对话框里拖放解决。
     * 关系克隆操作可以选择要对哪些属性做克隆，以及要不要删除from图像。
     */
    clone(options: {from?: SimpleIllust, to?: SimpleIllust}, onSucceed?: (from: number, to: number) => void)
}

export interface CloneImageInjectionContext {
    from: SimpleIllust | undefined
    to: SimpleIllust | undefined
    onSucceed?(from: number, to: number): void
}

export const CloneImageContent = defineComponent({
    setup() {
        return () => undefined
    }
})

export function useCloneImageService(): CloneImageContext {
    const { push } = useDialogServiceContext()
    return {
        clone(options: { from?: SimpleIllust; to?: SimpleIllust }, onSucceed?: (from: number, to: number) => void) {
            push({
                type: "cloneImage",
                context: {from: options.from, to: options.to, onSucceed}
            })
        }
    }
}

