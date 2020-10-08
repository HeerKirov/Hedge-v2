import { defineComponent } from "vue"
import SideLayout from "../SideLayout"
import SideBar from "../SideBar"
import TopBar from "../TopBar"
import ImageGrid from "../Grid"
import TopBarOfGridPanel from "./TopBarOfGridPanel"
import SideBarOfGridPanel from "./SideBarOfGridPanel"
import "./style.scss"

import img1 from "../../../assets/img1.jpg"
import img2 from "../../../assets/img2.jpg"
import img3 from "../../../assets/img3.jpg"

/**
 * 用来展示成组的内容(集合/画集)的覆盖式弹出面板。
 */
export default defineComponent({
    setup() {
        const images = [img1, img2, img3, img1, img2, img3, img1, img2, img3, img1, img2, img3]

        return () => <div class="v-grid-panel">
            <SideLayout>
                {{
                    side: () => <SideBar>
                        {() => <SideBarOfGridPanel/>}
                    </SideBar>,
                    default: () => <>
                        <ImageGrid images={images}/>
                        <TopBar>
                            {() => <TopBarOfGridPanel/>}
                        </TopBar>
                    </>
                }}
            </SideLayout>
        </div>
    }
})