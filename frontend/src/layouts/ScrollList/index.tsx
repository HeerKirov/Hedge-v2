import { computed, defineComponent, onMounted, PropType, ref } from "vue"
import style from "./style.module.scss"

export default defineComponent({
    props: {
        /**
         * 位于滚动区域和内容中夹着的padding。这部分padding会被自动算入容器高度。
         */
        padding: null as any as PropType<{ top?: number, bottom?: number, left?: number, right?: number } | number>,
        /**
         * 虚拟列表内容的总高度。
         */
        totalHeight: {type: Number, required: true}
    },
    emits: [],
    setup(props, { emit, slots }) {
        const scrollDivRef = ref<HTMLDivElement>()
        const contentDivRef = ref<HTMLDivElement>()

        onMounted(() => {
            console.log(scrollDivRef.value?.getBoundingClientRect())
            console.log(contentDivRef.value?.getBoundingClientRect())

            console.log(scrollDivRef.value?.clientHeight, scrollDivRef.value?.offsetHeight)
        })

        const onScroll = (e: Event) => {
            const div = (e.target as HTMLDivElement)
            const paddingTop = typeof props.padding === "number" ? props.padding : props.padding?.top ?? 0
            const paddingBottom = typeof props.padding === "number" ? props.padding : props.padding?.bottom ?? 0

            const offsetTop = div.scrollTop <= paddingTop ? 0 : div.scrollTop - paddingTop
            const scrollBottom = props.totalHeight - div.scrollTop - div.clientHeight + paddingTop + paddingBottom
            const offsetBottom = scrollBottom <= paddingBottom ? 0 : scrollBottom - paddingBottom
            const offsetHeight = props.totalHeight - offsetTop - offsetBottom

            console.log(`top=${offsetTop}, height=${offsetHeight}`)
        }

        const padding = computed(() => typeof props.padding === "number" ? ({
            padding: `${props.padding}px`
        }) : ({
            paddingTop: `${props.padding?.top ?? 0}px`,
            paddingBottom: `${props.padding?.bottom ?? 0}px`,
            paddingLeft: `${props.padding?.left ?? 0}px`,
            paddingRight: `${props.padding?.right ?? 0}px`,
        }))

        return () => <div ref={scrollDivRef} class={style.scrollList} style={padding.value} onScroll={onScroll}>
            <div ref={contentDivRef} class={style.scrollContent}>
                {slots.default?.()}
            </div>
        </div>
    }
})