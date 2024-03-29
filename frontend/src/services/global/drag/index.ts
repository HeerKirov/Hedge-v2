import { readonly, ref, Ref, unref } from "vue"
import { TypeDefinition } from "./definition"

/**
 * 它提供一组函数，用于直接实现拖拽功能，同时还负责自动注入拖拽的传递数据。
 */
export function useDraggable<T extends keyof TypeDefinition>(type: T | Ref<T>, data: Ref<TypeDefinition[T]> | (() => TypeDefinition[T])) {
    const onDragstart = typeof data === "function" ? (e: DragEvent) => {
        if(e.dataTransfer) {
            e.dataTransfer.setData("type", unref(type))
            e.dataTransfer.setData("data", JSON.stringify(data()))
        }
    } : (e: DragEvent) => {
        if(e.dataTransfer) {
            e.dataTransfer.setData("type", unref(type))
            e.dataTransfer.setData("data", JSON.stringify(data.value))
        }
    }

    const onDragend = (e: DragEvent) => {
        if(e.dataTransfer) {
            e.dataTransfer.clearData("type")
            e.dataTransfer.clearData("data")
        }
    }

    return {onDragstart, onDragend}
}

interface Droppable {
    isDragover: Readonly<Ref<boolean>>
    onDragenter(): void
    onDragleave(): void
    onDrop(e: DragEvent): void
    onDragover(e: DragEvent): void
}

interface DroppableOptions {
    stopPropagation?: boolean
}

/**
 * 提供一组对应的函数，用于直接实现拖放功能，同时还负责解析拖放获得的传递数据。
 */
export function useDroppable<T extends keyof TypeDefinition>(byType: T | T[], event: (data: TypeDefinition[T], type: T) => void, options?: DroppableOptions) {
    return useDroppableInternal<T>(typeof byType === "string" ? (data, type) => {
        if(byType === type) {
            event(<TypeDefinition[T]>data, type)
        }
    } : (data, type) => {
        if(byType.includes(type)) {
            event(<TypeDefinition[T]>data, type)
        }
    }, options)
}

function useDroppableInternal<T extends keyof TypeDefinition>(event: (data: TypeDefinition[T], type: T) => void, options: DroppableOptions | undefined): Droppable {
    const isDragover: Ref<boolean> = ref(false)
    const onDragenter = () => isDragover.value = true
    const onDragleave = () => isDragover.value = false

    const onDrop = (e: DragEvent) => {
        if(e.dataTransfer) {
            const type = <T>e.dataTransfer.getData("type")
            if(!type) {
                //可能发过来的并不是droppable的东西
                return
            }
            let data: any
            try {
                data = JSON.parse(e.dataTransfer?.getData("data"))
            }catch (e) {
                //可能发过来的并不是droppable的东西
                return
            }

            e.preventDefault()
            if(options?.stopPropagation) {
                //阻止向上传递事件，以避免存在上下叠加的dropEvents时，误触上层的drop事件
                e.stopImmediatePropagation()
                e.stopPropagation()
            }

            event(data, type)
        }
        isDragover.value = false
    }

    const onDragover = (e: DragEvent) => {
        e.preventDefault()
    }

    return {isDragover: readonly(isDragover), onDragenter, onDragleave, onDrop, onDragover}
}
