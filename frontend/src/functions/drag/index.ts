import { readonly, ref, Ref, unref } from "vue"
import { TypeDefinition } from "./definition"

/**
 * 它提供一组函数，用于直接实现拖拽功能，同时还负责自动注入拖拽的传递数据。
 */
export function useDraggable<T extends keyof TypeDefinition>(type: T | Ref<T>, data: Ref<TypeDefinition[T]>) {
    const onDragstart = (e: DragEvent) => {
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

/**
 * 提供一组对应的函数，用于直接实现拖放功能，同时还负责解析拖放获得的传递数据。
 */
export function useDroppable<T extends keyof TypeDefinition>(event: (type: T, data: TypeDefinition[T]) => void): Droppable {
    const isDragover: Ref<boolean> = ref(false)
    const onDragenter = () => isDragover.value = true
    const onDragleave = () => isDragover.value = false

    const onDrop = (e: DragEvent) => {
        e.preventDefault()
        if(e.dataTransfer) {
            const type = <T>e.dataTransfer.getData("type")
            const data = JSON.parse(e.dataTransfer?.getData("data"))
            event(type, data)
        }
        isDragover.value = false
    }

    const onDragover = (e: DragEvent) => {
        e.preventDefault()
    }

    return {isDragover: readonly(isDragover), onDragenter, onDragleave, onDrop, onDragover}
}

/**
 * 捕获固定拖放数据类型的拖放功能组。
 */
export function useDroppableBy<T extends keyof TypeDefinition>(byType: T, event: (data: TypeDefinition[T]) => void) {
    return useDroppable((type, data) => {
        if(type === byType) {
            event(<TypeDefinition[T]>data)
        }
    })
}

