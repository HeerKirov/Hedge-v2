import { defineComponent } from "vue"
import { DataRouter, ColumnNumButton } from "@/layouts/topbars"
import { QueryBox, QueryNotifyBadge } from "@/layouts/topbars/Query"
import { useCreatingAlbumService } from "@/layouts/globals/GlobalDialog/CreatingAlbum"
import { useAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        const { endpoint, viewController: { columnNum }, querySchema } = useAlbumContext()
        const { createAlbum } = useCreatingAlbumService()

        const setColumnNum = (v: number) => columnNum.value = v

        const openCreateDialog = () => {
            createAlbum(undefined, () => endpoint.refresh())
        }

        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <QueryBox class="w-75 is-stretch-item"
                          value={querySchema.searchBoxText.value} onUpdateValue={v => querySchema.searchBoxText.value = v}
                          expanded={querySchema.expanded.value} onUpdateExpanded={v => querySchema.expanded.value = v}/>
                <QueryNotifyBadge class="ml-1" schema={querySchema.schema.value} onClick={() => querySchema.expanded.value = true}/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
                <button class="button square is-white" onClick={openCreateDialog}><i class="fa fa-plus"/></button>
            </div>
        </div>
    }
})
