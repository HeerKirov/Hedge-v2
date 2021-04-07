import { defineComponent } from "vue"
import { arrays } from "@/utils/collections"

/**
 * 详情页面的侧边栏，显示原始数据的分栏。
 */
export default defineComponent({
    setup() {
        //侧边栏信息采用即时编辑模式，点击某项直接编辑，失去焦点或点击确认即保存
        return () => <div class="v-side-bar-detail origin">
            <p class="is-size-7"><i class="fa fa-pager mr-2"/><span class="can-be-selected">pixiv <b>98120978</b></span></p>
            <p class="is-size-7 mt-2"><i class="fa fa-file-image mr-2"/><b>JPEG</b>图片</p>
            <h1 class="is-size-6 my-4">这一行是标题</h1>
            <div class="my-2">
                <p class="is-size-7"><i class="fa fa-images mr-2"/>关联项 <b>98120979</b></p>
            </div>
            <div class="my-2">
                <p class="is-size-7"><i class="fa fa-clone mr-2"/>Pool 《<b>???</b>》</p>
            </div>
            <div class="mt-4">
                {arrays.newArray(35, i => <span class="tag is-light is-primary mr-1">标签 {i}</span>)}
            </div>
            
            <p class="mt-1 is-size-7">添加时间 2020-10-01 02:00:00</p>
            <p class="mt-1 is-size-7">上次修改 2020-10-01 18:00:00</p>
            {/*智能化显示时间。默认显示的是添加时间，当排序时间与其不同时，才列出额外的项显示 */}
        </div>
    }
})