import { computed, inject, InjectionKey, onMounted, onUnmounted, provide, Ref, ref, watch } from "vue"
import { ObjectEndpoint, ObjectEndpointOptions, useObjectEndpoint } from "./object-endpoint"

/*
 * 此处提供了对object-endpoint的二次包装，提供基于use的延迟加载与缓存数据端点。
 */

export function installObjectLazyObject<PATH, MODEL, FORM>(symbol: InjectionKey<ObjectLazyObjectInjection<PATH, MODEL, FORM>>, options: ObjectEndpointOptions<PATH, MODEL, FORM>) {
    const originPath = options.path

    const useCount = ref(0)

    const using = computed(() => useCount.value > 0)

    const path: Ref<PATH | null> = ref(null)

    watch(using, using => {
        if(using) {
            path.value = originPath.value
        }
    })

    watch(originPath, originPath => {
        path.value = using.value ? originPath : null
    })

    const endpoint = useObjectEndpoint({...options, path})

    provide(symbol, {endpoint, useCount})
}

export function useObjectLazyObject<PATH, MODEL, FORM>(symbol: InjectionKey<ObjectLazyObjectInjection<PATH, MODEL, FORM>>) {
    const { endpoint, useCount } = inject(symbol)!

    onMounted(() => useCount.value += 1)

    onUnmounted(() => useCount.value -= 1)

    return endpoint
}

export interface ObjectLazyObjectInjection<PATH, MODEL, FORM> {
    useCount: Ref<number>
    endpoint: ObjectEndpoint<MODEL, FORM>
}
