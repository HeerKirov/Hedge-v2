import { InjectionKey, readonly, ref, Ref } from "vue";

export const InitContextInjection: InjectionKey<Context> = Symbol()

export interface Context {
    page: {
        num: Readonly<Ref<number>>
        next(): void
        prev(): void
    }
}

export function useInitContext(defaultPage: number = 0): Context {
    const pageNum = ref(defaultPage)

    return {
        page: {
            num: readonly(pageNum),
            next() { pageNum.value += 1 },
            prev() { pageNum.value -= 1 }
        }
    }
}