import { defineComponent, ref } from "vue"

/**
 * 标签列表右侧的详情面板。
 */
export default defineComponent({
    setup() {
        return () => <div id="tag-detail">
            <p class="is-size-7">地址A.地址B.地址C</p>
            <p><b class="is-size-5">标签名称</b><i class="has-text-grey is-size-7">别名1 / 别名2</i></p>
            <div class="ml-1 mt-4">
                <p class="is-size-7">
                    <i class="fa fa-tag mr-1"/><span class="mr-3">标签</span>
                    {/* <i class="fa fa-building mr-1"/><span class="mr-3">地址段</span> */}
                </p>
                <p class="is-size-7 mt-2">
                    <i class="fa fa-object-group mr-1"/><span class="mr-3">组</span>
                    <i class="fa fa-sort-alpha-down mr-1"/><span class="mr-3">序列化</span>
                    <b class="mr-1">!</b><span class="mr-3">强制唯一</span>
                </p>
                {/*组和组成员是二选一的标记*/}
                <p class="is-size-7 mt-2">
                    <i class="fa fa-object-ungroup mr-1"/><span class="mr-3">组成员</span>
                    <i class="fa fa-sort-alpha-down mr-1"/><span class="mr-1">序列化顺位</span><b class="mr-3">1</b>
                </p>
            </div>
            <div class="notification mt-5 p-3 is-size-7">
                标签的描述。
            </div>
        </div>
    }
})
