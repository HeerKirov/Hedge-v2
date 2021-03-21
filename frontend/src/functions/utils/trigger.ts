import { reactive, ref } from "vue"

export function useTrigger() {
    const trigger = reactive({
        value: 0,
        trigger() {
            trigger.value += 1
        }
    })

    return trigger
}

export function useRefTrigger() {
    const value = ref(0)
    const trigger = () => value.value += 1

    return {value, trigger}
}