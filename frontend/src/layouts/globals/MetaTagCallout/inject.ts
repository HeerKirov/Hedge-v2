import { readonly, ref } from "vue"
import { installation } from "@/functions/utils/basic"
import { MetaTagTypes } from "@/functions/adapter-http/impl/all"
import { Rect } from "@/components/data/PopupBox"
import { sleep } from "@/utils/process"

export const [installMetaTagCallout, useMetaTagCallout] = installation(function () {
    const target = ref<{type: MetaTagTypes, id: number, base: Rect}>()

    let awaitOpen = false

    const open = async (r: Rect, type: MetaTagTypes, id: number) => {
        //tips: 点击按钮时，由于事件传导顺序，close会被open先触发，因此使open延迟生效
        //使用一个标记，在标记生效期间告知close事件，接下来有新的open，因此不必close。这样可以抹消点击后的闪烁
        awaitOpen = true
        await sleep(1)
        awaitOpen = false
        target.value = {type, id, base: r}
    }

    const close = () => {
        if(!awaitOpen) {
            target.value = undefined
        }
    }

    return {open, close, target: readonly(target)}
})
