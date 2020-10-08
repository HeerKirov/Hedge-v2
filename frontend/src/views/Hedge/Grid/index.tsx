import { defineComponent, PropType } from "vue"
import ImageItem from "./Item"
import SelectToolBar from "./SelectToolBar"
import "./style.scss"

/**
 * 列表区域。因为这一部分会复用，所以单独抽离出来。
 * 这一部分主要呈grid形态展示列表，并且提供选框功能。
 */
export default defineComponent({
    props: {
        images: null as PropType<string[]>
    },
    setup(props) {
        return () => <div class="v-image-grid">
            <div class="grid-content">
                {props.images.map(image => <ImageItem src={image} numTag={2} selected={image.endsWith(".png")}/>)}
            </div>
            <SelectToolBar class="absolute right-bottom mr-5 mb-4"/>
        </div>
    }
})