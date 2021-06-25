import { defineComponent } from "vue"
import {
    DataRouter,
    ColumnNumButton,
    FitTypeButton,
    CollectionModeButton,
    SearchBox
} from "@/layouts/topbar-components"
import { FitType } from "@/layouts/data/IllustGrid"
import { useElementPopupMenu } from "@/functions/module"
import { useIllustContext } from "./inject"

export default defineComponent({
    setup() {
        const { viewController: { fitType, columnNum, collectionMode }} = useIllustContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v
        const setCollectionMode = (v: boolean) => collectionMode.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">

            </div>
            <div class="layout-container">
                <CollectionModeButton class="mr-1" value={collectionMode.value} onUpdateValue={setCollectionMode}/>
                <SearchBox class="w-75 is-stretch-item"/>
            </div>
            <div class="layout-container">
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
                <MenuButton/>
            </div>
        </div>
    }
})

const MenuButton = defineComponent({
    setup() {
        const menu = useElementPopupMenu(() => [

        ], {position: "bottom", align: "left", offsetY: 4})

        return () => <button ref={menu.element} class="square button no-drag radius-large is-white" onClick={() => menu.popup()}>
            <span class="icon"><i class="fa fa-ellipsis-v"/></span>
        </button>
    }
})
