import { Ref } from "vue"
import { PaginationData, QueryEndpointInstance } from "@/functions/utils/endpoints/query-endpoint"
import { TypeDefinition } from "@/functions/feature/drag/definition"
import { assetsUrl } from "@/functions/app"
import style from "./style.module.scss"

export function ItemImage(props: {thumbnailFile: string | null, type: string | undefined, id: number}) {
    return <div class={style.img}><img src={assetsUrl(props.thumbnailFile)} alt={`${props.type}-${props.id}`}/></div>
}

export interface InjectionContext<T, TYPE extends keyof TypeDefinition> {
    queryEndpoint: QueryEndpointInstance<T> | undefined
    data: Ref<PaginationData<T>>
    selected: Ref<number[]>
    lastSelected: Ref<number | null>
    draggable: boolean
    droppable: Ref<boolean> | undefined
    draggingFromLocal: Ref<boolean>
    drop?(insertIndex: number | null, illusts: TypeDefinition[TYPE], mode: "ADD" | "MOVE"): void
}
