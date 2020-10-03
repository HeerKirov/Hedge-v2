import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        /**
         * 侧边栏需要包括的东西：
         * - 开启时的关闭侧边栏的按钮
         * - 主页tab
         * - 最近导入tab
         * - 时间分区tab & 可折叠的部分最近的时间项
         * - 文件夹tab & 可折叠的部分最近的文件夹项
         * - 画集tab
         * - 标签管理tab
         * - 主题管理tab & 可折叠的部分最近/收藏的主题项
         * - 设置按钮
         * - 向导页面按钮
         * - 开始屏幕按钮
         * 
         * 题外话，顶栏需要包括的东西：
         * - 关闭侧边栏时，开启侧边栏的按钮
         * - super搜索框(可激活结构化可配置的查询条件面板)
         * - 填充显示切换开关
         * - 尺寸切换器
         * - 查询模式切换器(image模式/collection模式)
         * - 
         * 
         * 再一个题外话，要把数据模型确立为严格的collection - image 1:N 模式么？这样就可以基于collection做搜索了。
         */
        return () => <div class="v-side-bar">
            <div class="title-bar absolute top w-100"></div>
        </div>
    }
})