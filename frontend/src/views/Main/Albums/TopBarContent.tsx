import { defineComponent } from "vue"
import { DataRouter, ColumnNumButton, SearchBox } from "@/layouts/topbars"
import { useAlbumContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewController: { columnNum }} = useAlbumContext()

        const setColumnNum = (v: number) => columnNum.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
                <button class="button square is-white"><i class="fa fa-plus"/></button>
            </div>
        </div>
    }
})
