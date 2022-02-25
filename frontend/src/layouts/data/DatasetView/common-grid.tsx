import { Ref } from "vue"
import { PaginationData, QueryEndpointInstance } from "@/functions/endpoints/query-endpoint"
import { TypeDefinition } from "@/services/global/drag/definition"
import { assetsUrl } from "@/services/app"
import style from "./style.module.scss"

export function ItemImage(props: {thumbnailFile: string | null, type: string | undefined, id: number}) {
    return <div class={style.content}>
        <img src={assetsUrl(props.thumbnailFile)} alt={`${props.type}-${props.id}`}/>
    </div>
}

export function ItemNumTag(props: {count: number}) {
    return <span class={[style.numTag, "tag", "is-dark"]}><i class="fa fa-images"/>{props.count}</span>
}

export function ItemFavIcon() {
    return <i class={[style.favTag, "fa", "fa-heart", "has-text-danger", "is-size-medium"]}/>
}

export interface InjectionContext<T, TYPE extends keyof TypeDefinition> {
    queryEndpoint: QueryEndpointInstance<T> | undefined
    data: Ref<PaginationData<T>>
    selected: Ref<number[]>
    lastSelected: Ref<number | null>
    columnNum: Ref<number>
    draggable: boolean
    droppable: Ref<boolean> | undefined
    draggingFromLocal: Ref<boolean>
    drop?(insertIndex: number | null, illusts: TypeDefinition[TYPE], mode: "ADD" | "MOVE"): void
}
