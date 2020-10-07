import { defineComponent, PropType } from "vue"
import ImageCover from "./ImageCover"
import SelectToolBar from "./SelectToolBar"

/**
 * 列表区域。因为这一部分会复用，所以单独抽离出来。
 */
export default defineComponent({
    props: {
        images: null as PropType<string[]>
    },
    setup(props) {
        return () => <div class="v-image-grid">
            <div class="grid-content">
                {props.images.map(image => <ImageCover src={image} numTag={2} selected={image.endsWith(".png")}/>)}
            </div>
            <SelectToolBar class="absolute right-bottom mr-5 mb-4"/>
        </div>
    }
})