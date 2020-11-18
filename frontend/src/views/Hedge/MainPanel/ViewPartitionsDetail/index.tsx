import { computed, ComputedRef, defineComponent, inject, watch } from "vue"
import TopBar from "../../TopBar"
import TopBarContent from "./TopBarContent"
import ImageGrid from "@/layouts/ImageGrid"
import "./style.scss"

import img1 from "@/assets/img1.local.jpg"
import img2 from "@/assets/img2.local.jpg"
import { SideBarContextInjection } from "../inject"
import { useRoute } from "vue-router"

export default defineComponent({
    setup() {
        const route = useRoute()
        const partitionName: ComputedRef<string | undefined> = computed(() => route.params['partition'] as string)

        const sideBarData = inject(SideBarContextInjection)!

        watch(partitionName, partitionName => {
            if(partitionName) {
                sideBarData.pushSubItem(partitionName, translatePartitionToTitle(partitionName))
            }
        }, {immediate: true})

        const images = [
            img1, img2, img1, img2, img1, img1, img2, img1, img2, img1
        ]

        return () => <div id="hedge-partitions-detail">
            <ImageGrid items={images} marginTopBar={true}/>
            <TopBar>
                <TopBarContent/>
            </TopBar>
        </div>
    }
})

function translatePartitionToTitle(partitionName: string): string {
    const [y, m, d] = partitionName.split('-').map(s => parseInt(s))
    return `${y}年${m}月${d}日`
}