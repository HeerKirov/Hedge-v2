import { defineComponent, ref, watch } from "vue"
import { useHttpClient } from "@/services/app"
import { BatchQueryResult, SourceMappingTargetDetail } from "@/functions/adapter-http/impl/source-tag-mapping"
import { MetaType } from "@/functions/adapter-http/impl/generic"
import { useToast } from "@/services/module/toast"
import { objects } from "@/utils/primitives"
import { MappingTagSelectList } from "./Components"
import { usePanelContext } from "./inject"

export default defineComponent({
    setup() {
        const { source, derives, refresh } = useSourceDeriveItems()

        return () => <MappingTagSelectList source={source.value} mappings={derives.value} onUpdated={refresh}/>
    }
})

function useSourceDeriveItems() {
    const toast = useToast()
    const httpClient = useHttpClient()
    const { identity } = usePanelContext()

    const source = ref<string>()
    const derives = ref<BatchQueryResult[]>([])

    const loadDerives = async () => {
        const sourceDataRes = await httpClient.illust.image.originData.get(identity.value!.id)
        if(!sourceDataRes.ok) {
            toast.handleException(sourceDataRes.exception)
            derives.value = []
            return
        }
        if(sourceDataRes.data.source === null || !sourceDataRes.data.tags?.length) {
            derives.value = []
            return
        }
        source.value = sourceDataRes.data.source
        const res = await httpClient.sourceTagMapping.batchQuery({source: sourceDataRes.data.source, tagNames: sourceDataRes.data.tags.map(i => i.name)})
        if(!res.ok) {
            toast.handleException(res.exception)
            derives.value = []
            return
        }
        derives.value = sortDerives(res.data)
    }

    const refresh = () => {
        if(identity.value !== null && identity.value.type === "IMAGE") {
            loadDerives().finally()
        }else{
            derives.value = []
        }
    }

    watch(identity, async (identity, old) => {
        if(identity !== null && identity.type === "IMAGE") {
            //确认首次执行，或identity实质未变
            if(old === undefined || !objects.deepEquals(identity, old)) {
                await loadDerives()
            }
        }else{
            derives.value = []
        }
    }, {immediate: true})

    return {source, derives, refresh}
}

function sortDerives(sourceTags: BatchQueryResult[]): BatchQueryResult[] {
    //结果不采用默认的source tags顺序，而是按照mapping得到的meta tag类型和权重做排序。
    //对于每个sourceTag，使用它的映射结果中权重最高的项作为它的权重。
    //权重依据：type(author > topic > tag), id。
    return sourceTags
        .map(st => [st, getMaxTarget(st.mappings)] as const)
        .sort(([, a], [, b]) => compareMappingTarget(a, b))
        .map(([st,]) => st)
}

function getMaxTarget(targets: SourceMappingTargetDetail[]): SourceMappingTargetDetail | null {
    let max: SourceMappingTargetDetail | null = null
    for(const target of targets) {
       if(max === null || compareMappingTarget(target, max) < 0) {
           max = target
       }
    }
    return max
}

function compareMappingTarget(a: SourceMappingTargetDetail | null, b: SourceMappingTargetDetail | null): number {
    if(a !== null && b === null) return -1
    else if(a === null && b !== null) return 1
    else if(a === null && b === null) return 0
    else return a!.metaType !== b!.metaType ? compareMetaType(a!.metaType, b!.metaType) : compareNumber(a!.metaTag.id, b!.metaTag.id)
}

function compareMetaType(a: MetaType, b: MetaType): number {
    return compareNumber(META_TYPE_ORDINAL[a], META_TYPE_ORDINAL[b])
}

function compareNumber(a: number, b: number): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

const META_TYPE_ORDINAL = {
    "AUTHOR": 1,
    "TOPIC": 2,
    "TAG": 3
}
