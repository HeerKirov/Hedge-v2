import { defineComponent, ref, provide, InjectionKey, Ref } from "vue"
import { RouterView } from "vue-router"
import SideLayout from "./SideLayout"
import SideBar from "./SideBar"
import TopBar from "./TopBar"
import ImageTopBar from "./TopBarOfImage"
import "./style.scss"

export const sideBarSwitchInjection: InjectionKey<Ref<boolean>> = Symbol()

export const sideBarWidthInjection: InjectionKey<Ref<number>> = Symbol()

export default defineComponent({
    setup() {
        const sideBarSwitch = ref(true)
        const sideBarWidth = ref(225)

        provide(sideBarSwitchInjection, sideBarSwitch)
        provide(sideBarWidthInjection, sideBarWidth)

        /**
         * 题外话，顶栏需要包括的东西:
         * 1. 图库需要的顶栏
         * - super搜索框(可激活结构化可配置的查询条件面板)
         * - 填充显示切换开关
         * - 尺寸切换器
         * - 查询模式切换器(image模式/collection模式)
         * - (最近导入)导入按钮
         * 2. 画集需要的顶栏
         * - super搜索框
         * - 尺寸切换器
         * 3. 元数据需要的顶栏
         * - (列表)搜索框
         * 4. 文件夹需要的顶栏
         * - (文件夹列表)搜索框
         */
        return () => <div class="v-hedge">
            <SideLayout>
                {{
                    side: () => <SideBar/>,
                    default: () => <>
                        <RouterView/>
                        <TopBar>
                            {() => <ImageTopBar/>}
                        </TopBar>
                    </>
                }}
            </SideLayout>
        </div>
    }
})