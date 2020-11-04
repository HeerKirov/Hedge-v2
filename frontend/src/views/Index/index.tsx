import { defineComponent, PropType, Ref, ref } from "vue"

export default defineComponent({
    setup() {
        const initView = ref(true)
        const loading: Ref<LoadingType | undefined> = ref("data")

        return () => <div id="index">
            {loading.value && <Loading type={loading.value}/>}
        </div>
    }
})

type LoadingType = "data" | "resource" | "starting"

const loadingMessage = {
    "data": "正在构建App数据……",
    "resource": "正在更新App资源……",
    "starting": "正在启动服务……"
}

const Loading = defineComponent({
    props: {
        type: {type: null as any as PropType<LoadingType>, required: true}
    },
    setup(props) {
        return () => <div class="fixed center has-text-centered">
            <span class="icon"><i class="fa fa-3x fa-code-branch"/></span>
            <p class="mt-4">{loadingMessage[props.type]}</p>
        </div>
    }
})