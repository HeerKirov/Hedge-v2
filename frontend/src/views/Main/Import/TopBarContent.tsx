import { defineComponent } from "vue"

export default defineComponent({
    setup() {
        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="button no-drag radius-large is-success">
                    <span class="icon"><i class="fa fa-plus"/></span>
                    <span>导入项目</span>
                </button>
            </div>
            <div class="layout-container">
                <button class="button no-drag radius-large is-white">
                    <i class="fa fa-file-import mr-2"/>正在导入
                </button>
                <button class="button no-drag radius-large is-white">
                    <i class="fa fa-file mr-2"/>导入列表
                </button>
            </div>
            <div class="layout-container">
                <button class="button no-drag radius-large is-white">
                    <span class="icon"><i class="fa fa-check"/></span>
                    <span>执行导入</span>
                </button>
                <button class="square button no-drag radius-large is-white">
                    <span class="icon"><i class="fa fa-ellipsis-v"/></span>
                </button>
            </div>
        </div>
    }
})
