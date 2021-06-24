import { Ref } from "vue"
import { useScrollView, ScrollView } from "@/components/features/VirtualScrollView"
import { FitType } from "@/layouts/data/IllustGrid"
import { ListEndpointResult, useListEndpoint } from "@/functions/utils/endpoints/list-endpoint"
import { Illust } from "@/functions/adapter-http/impl/illust"
import { useHttpClient, useLocalStorageWithDefault } from "@/functions/app"
import { useNotification } from "@/functions/document/notification"
import { installation } from "@/functions/utils/basic"

export interface IllustContext {
    endpoint: ListEndpointResult<Illust>
    scrollView: Readonly<ScrollView>
    viewController: {
        fitType: Ref<FitType>
        columnNum: Ref<number>
    }
}

export const [installIllustContext, useIllustContext] = installation(function(): IllustContext {
    const list = useListContext()

    const viewController = useViewController()

    return {...list, viewController}
})

function useListContext() {
    const httpClient = useHttpClient()
    const { handleError } = useNotification()
    const scrollView = useScrollView()

    const endpoint = useListEndpoint({
        async request(offset: number, limit: number) {
            const res = await httpClient.illust.list({offset, limit, order: "-orderTime", type: "IMAGE"})
            return res.ok ? {ok: true, ...res.data} : {ok: false, message: res.exception?.message ?? "unknown error"}
        },
        handleError
    })

    return {endpoint, scrollView}
}

function useViewController() {
    const fitType = useLocalStorageWithDefault<FitType>("illust-list-fit-type", "cover")
    const columnNum = useLocalStorageWithDefault<number>("illust-list-column-num", 8)

    return {fitType, columnNum}
}
