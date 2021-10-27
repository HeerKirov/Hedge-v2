import { defineComponent } from "vue"
import { DataRouter, ColumnNumButton, SearchBox } from "@/layouts/topbars"
import { useCreatingAlbumDialog } from "@/layouts/dialogs/CreatingAlbumDialog"
import { useAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        const { endpoint, viewController: { columnNum }} = useAlbumContext()
        const { createAlbum } = useCreatingAlbumDialog()

        const setColumnNum = (v: number) => columnNum.value = v

        const openCreateDialog = () => {
            createAlbum(undefined, () => endpoint.refresh())
        }

        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
                <button class="button square is-white" onClick={openCreateDialog}><i class="fa fa-plus"/></button>
            </div>
        </div>
    }
})
