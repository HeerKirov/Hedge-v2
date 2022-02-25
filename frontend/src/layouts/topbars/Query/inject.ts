import { ref, Ref, watch } from "vue"
import { Dialect, QueryRes } from "@/functions/adapter-http/impl/util-query"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"


export interface QuerySchemaContext {
    /**
     * 用作查询框的输入。
     */
    searchBoxText: Ref<string | undefined>
    /**
     * 扩展区域的开关。
     */
    expanded: Ref<boolean | undefined>
    /**
     * 最终输出的query结果。将它用于最终查询参数。
     */
    query: Ref<string | undefined>
    /**
     * 解析完成的Query Schema。
     */
    schema: Ref<QueryRes | undefined>
}

export function useQuerySchemaContext(dialect: Dialect): QuerySchemaContext {
    const toast = useToast()
    const httpClient = useHttpClient()

    const searchBoxText = ref<string>()

    const expanded = ref<boolean>()
    const query = ref<string>()
    const schema = ref<QueryRes>()

    watch(searchBoxText, async searchBoxText => {
        const text = searchBoxText?.trim()
        if(!text) {
            query.value = undefined
            expanded.value = undefined
            schema.value = undefined
        }else{
            const res = await httpClient.queryUtil.querySchema({dialect, text})
            if(!res.ok) {
                toast.handleException(res.exception)
            }else{
                schema.value = res.data
                query.value = text
                expanded.value = expanded.value || !!res.data.errors.length
            }
        }
    })

    return {searchBoxText, expanded, query, schema}
}
