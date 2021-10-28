import { computed, defineComponent, ref } from "vue"
import { useElementPopupMenu } from "@/functions/module/popup-menu"
import { FitType } from "@/layouts/data/IllustGrid"
import { ColumnNumButton, DataRouter, FitTypeButton } from "@/layouts/topbars"
import { BackspaceButton } from "@/views/Main/view-stacks"
import { usePreviewContext } from "./inject"

export default defineComponent({
    setup() {
        const { data: { target }, images: { viewController: { fitType, columnNum } } } = usePreviewContext()

        const setFitType = (v: FitType) => fitType.value = v
        const setColumnNum = (v: number) => columnNum.value = v

        return () => <div class="middle-layout">
            <div class="layout-container">
                <BackspaceButton/>
                {target.value && <span class="ml-2 is-size-medium">{target.value.title}</span>}
            </div>
            <div class="layout-container">
                <FavoriteButton/>
                <ExternalButton/>
                <EditLockButton/>
                <DataRouter/>
                <FitTypeButton value={fitType.value} onUpdateValue={setFitType}/>
                <ColumnNumButton value={columnNum.value} onUpdateValue={setColumnNum}/>
            </div>
        </div>
    }
})

const FavoriteButton = defineComponent({
    setup() {
        const { data: { target, setTargetData } } = usePreviewContext()

        const favorite = computed(() => target.value?.favorite ?? false)

        const click = () => setTargetData({ favorite: !favorite.value })

        return () => <button class="square button is-white no-drag" onClick={click}>
            <span class={`icon has-text-${favorite.value ? "danger" : "grey"}`}><i class="fa fa-heart"/></span>
        </button>
    }
})

const ExternalButton = defineComponent({
    setup() {
        const menu = useElementPopupMenu([
            {type: "normal", label: "在新窗口中打开"},
            {type: "separator"},
            {type: "normal", label: "批量导出"}
        ], {position: "bottom", offsetY: 6})

        return () => <button ref={menu.element} class="square button is-white no-drag" onClick={() => menu.popup()}><span class="icon"><i class="fa fa-external-link-alt"/></span></button>
    }
})

const EditLockButton = defineComponent({
    setup() {
        const editable = ref(false)
        const click = () => editable.value = !editable.value

        return () => <button class="square button no-drag radius-large is-white" onClick={click}>
            <span class="icon"><i class={`fa fa-${editable.value ? "unlock" : "lock"}`}/></span>
        </button>
    }
})
