import { defineComponent, inject, InjectionKey, provide, ref, Ref } from "vue"
import { useToast } from "@/functions/module/toast"
import { useHttpClient } from "@/functions/app"

export interface SourceImageEditDialogContext {
    /**
     * 打开新建模式的面板。此模式下，从三种不同的创建模式选择其一并执行新建。
     */
    openCreateDialog(onCreated?: () => void): void
    /**
     * 打开编辑模式的面板。
     */
    edit(key: SourceKey, onUpdated?: () => void): void
}

interface SourceKey {
    source: string
    sourceId: number
}

export const SourceImageEditDialog = defineComponent({
    setup() {
        return () => undefined
    }
})

export function installSourceImageEditDialog() {
    provide(dialogInjection, { task: ref(null) })
}

export function useSourceImageEditDialog(): SourceImageEditDialogContext {
    const { task } = inject(dialogInjection)!

    return {
        openCreateDialog(onCreated) {
            task.value = {mode: "create", onCreated}
        },
        edit(key, onUpdated) {
            task.value = {mode: "update", ...key, onUpdated}
        }
    }
}

interface InjectionContext {
    task: Ref<{
        mode: "create"
        onCreated?(): void
    } | {
        mode: "update"
        source: string
        sourceId: number
        onUpdated?(): void
    } | null>
}

const dialogInjection: InjectionKey<InjectionContext> = Symbol()
