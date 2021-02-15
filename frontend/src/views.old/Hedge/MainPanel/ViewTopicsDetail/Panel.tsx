import { defineComponent } from "vue"
import WrappedText from "@/components/WrappedText"
import Starlight from "@/components/Starlight"

import img1 from "@/assets/img1.local.jpg"

export default defineComponent({
    setup() {
        return () => <div id="panel">
            <div class="v-main box">
                <p>
                    <span class="icon"><i class="fa fa-hashtag"/></span>
                    <span class="can-select"><b class="is-size-5">主题名称</b><i class="ml-1 has-text-grey">别名1 / 别名2</i></span>
                </p>
                <p class="is-size-7 mt-2">
                    {/* <i class="fa fa-copyright mr-2"/><span class="mr-2">版权方</span> */}
                    <i class="fa fa-bookmark mr-2"/><span class="mr-2">作品</span>
                    {/* <i class="fa fa-user-ninja mr-2"/><span class="mr-2">角色</span> */}
                </p>
                <p class="mt-2">
                    <span class="tag mr-1">注解</span>
                    <span class="tag mr-1">注解2</span>
                </p>
                <p class="v-description">
                    <WrappedText value={"描述\n可换行"}/>
                </p>
                <div class="v-relations">
                    <div><i class="fa fa-chess-queen mr-2"/><span class="mr-2">父主题</span></div>
                    <div>
                        <a class="tag mr-1">父主题1</a>
                    </div>
                </div>
                <div class="v-relations">
                    <div><i class="fa fa-chess mr-2"/><span class="mr-2">子主题</span></div>
                    <div>
                        <a class="tag mr-1">子主题1</a>
                        <a class="tag mr-1">子主题2</a>
                        <a class="tag mr-1">子主题3</a>
                        <a class="no-wrap">在主题列表搜索全部子主题<i class="fa fa-angle-double-right ml-1"/></a>
                    </div>
                </div>
                <p class="mt-4"><Starlight value={4.35} showText={true}/></p>
            </div>
            <div class="v-about box">
                <span class="mr-2">相关链接:</span>
                <a><i class="fa fa-link mr-1"/>pixiv</a><span class="mx-2">|</span>
                <a><i class="fa fa-link mr-1"/>complex</a>
            </div>
            <div class="v-examples">
                <div><img src={img1}/></div>
                <div><img src={img1}/></div>
                <div><img src={img1}/></div>
                <div><img src={img1}/></div>
                <div class="v-more">
                    <a class="no-wrap">在图库搜索"主题名称"的全部项目<i class="fa fa-angle-double-right ml-1"/></a>
                </div>
            </div>
        </div>
    }
})