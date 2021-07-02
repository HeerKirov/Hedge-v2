import { defineComponent } from "vue"
import {
    DataRouter,
    ColumnNumButton,
    FitTypeButton,
    CollectionModeButton,
    SearchBox
} from "@/layouts/topbar-components"
import { FitType } from "@/layouts/data/IllustGrid"
import { useIllustContext } from "./inject"

//TODO 在TopBar组件添加公共的key event冒泡拦截
//TODO 在Input组件添加公共的key event冒泡拦截
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
            </div>
        </div>
    }
})
