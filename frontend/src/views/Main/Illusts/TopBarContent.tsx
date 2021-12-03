import { defineComponent } from "vue"
import { DataRouter, ColumnNumButton, FitTypeButton, CollectionModeButton } from "@/layouts/topbars"
import { QueryBox, QueryNotifyBadge } from "@/layouts/topbars/Query"
import { FitType } from "@/layouts/data/IllustGrid"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewController: { fitType, columnNum, collectionMode, partition, closePartition }, querySchema } = useIllustContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v
        const setCollectionMode = (v: boolean) => collectionMode.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">
                {partition && <>
                    <button class="square button no-drag radius-large is-white" onClick={closePartition}>
                        <span class="icon"><i class="fa fa-arrow-left"/></span>
                    </button>
                    <span class="ml-2 is-size-medium">{partition.value.year}年{partition.value.month}月{partition.value.day}日</span>
                </>}
            </div>
            <div class="layout-container">
                <CollectionModeButton class="mr-1" value={collectionMode.value} onUpdateValue={setCollectionMode}/>
                <QueryBox class="w-75 is-stretch-item"
                          value={querySchema.searchBoxText.value} onUpdateValue={v => querySchema.searchBoxText.value = v}
                          expanded={querySchema.expanded.value} onUpdateExpanded={v => querySchema.expanded.value = v}/>
                <QueryNotifyBadge class="ml-1" schema={querySchema.schema.value} onClick={() => querySchema.expanded.value = true}/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
            </div>
        </div>
    }
})
