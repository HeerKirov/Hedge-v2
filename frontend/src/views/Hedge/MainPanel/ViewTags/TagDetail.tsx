import { defineComponent } from "vue"
import WrappedText from "@/components/WrappedText"
import Starlight from "@/components/Starlight"

import img1 from "@/assets/img1.local.jpg"

/**
 * 标签列表右侧的详情面板。
 */
export default defineComponent({
    setup() {
        return () => <div id="tag-detail">
            <div>
                <a class="delete"/>
                <p class="can-select">地址A.地址B.地址C</p>
                <p class="can-select"><b class="is-size-5">标签名称</b><i class="ml-1 has-text-grey">别名1 / 别名2</i></p>
                <div class="v-meta">
                    <p>
                        <i class="fa fa-tag mr-1"/><span class="mr-3">标签</span>
                        {/* <i class="fa fa-building mr-1"/><span class="mr-3">地址段</span> */}
                    </p>
                    <p>
                        <i class="fa fa-object-group mr-1"/><span class="mr-3">组</span>
                        <i class="fa fa-sort-alpha-down mr-1"/><span class="mr-3">序列化</span>
                        <b class="mr-1">!</b><span class="mr-3">强制唯一</span>
                    </p>
                    {/*组和组成员是二选一的标记*/}
                    <p>
                        <i class="fa fa-object-ungroup mr-1"/><span class="mr-3">组成员</span>
                        <i class="fa fa-sort-alpha-down mr-1"/><span class="mr-1">序列化顺位</span><b class="mr-3">1</b>
                    </p>
                    <p>
                        <i class="fa fa-border-style mr-1"/>虚拟标签
                    </p>
                </div>
                <div class="v-annotations">
                    <span class="tag mr-1"><b class="mr-1">@</b>段.注解</span>
                    <span class="tag is-light is-primary mr-1"><i class="fa fa-link mr-1"/>地址段.链接</span>
                </div>
                <div class="v-description notification">
                    <WrappedText value={"标签的描述。\n可以换行。"}/>
                </div>
                <div class="v-conditions">
                    <div class="box">
                        <p class="v-title">
                            <i class="fa fa-subscript mr-1 mb-2"/>
                            <span class="tag is-link">标签A</span>{'&'}(<span class="tag is-light is-warning">标签B</span>|<span class="tag is-light is-success">标签C</span>)
                        </p>
                        <p class="v-meta">
                            <i class="fa fa-object-group mr-1"/><span class="mr-3">组关联</span>
                            <b class="mr-1">!</b><span class="mr-3">强制生效</span>
                        </p>
                        <p class="v-default">
                            <i class="fa fa-street-view mr-1"/><span class="mr-1">默认组员</span>
                            <b>子标签A</b>
                        </p>
                    </div>
                </div>
                <div class="v-score"><Starlight showText={true} value={4.95}/></div>
                <div class="v-examples">
                    <img src={img1}/>
                    <img src={img1}/>
                    <img src={img1}/>
                </div>
            </div>
        </div>
    }
})