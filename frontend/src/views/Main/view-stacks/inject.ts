import { inject, InjectionKey, provide, ref, Ref } from "vue"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { SliceDataView } from "@/functions/utils/endpoints/query-endpoint"

export interface ViewStacks {
    stacks: Readonly<Ref<DetailViewInfo[]>>
    openView(info: DetailViewInfo): void
    goBack(): void
    closeAll(): void
}

export type DetailViewInfo = {
    type: "image"
    data: SliceDataView<Illust>
    currentIndex: number
} | {
    type: "collection"
    illustId: number
} | {
    type: "album"
    albumId: number
}

export function installViewStacks(): ViewStacks {
    const stacks: Ref<DetailViewInfo[]> = ref([])

    const viewStacks = {
        openView(info: DetailViewInfo) {
            stacks.value.push(info)
        },
        goBack() {
            if(stacks.value.length > 0) {
                stacks.value.splice(stacks.value.length - 1, 1)
            }
        },
        closeAll() {
            stacks.value.splice(0, stacks.value.length)
        },
        stacks
    }

    provide(viewStacksInjection, viewStacks)

    return viewStacks
}

export function useViewStacks(): ViewStacks {
    return inject(viewStacksInjection)!
}

const viewStacksInjection: InjectionKey<ViewStacks> = Symbol()
