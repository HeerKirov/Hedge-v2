import { defineComponent } from "vue"
import "./style.scss"

/**
 * 详情页的图片区域。
 */
export default defineComponent({
    props: {
        src: String
    },
    setup(props) {
        return () => <div id="image-detail">
            <div>
                <img src={props.src}></img>
            </div>
        </div>
    }
})
