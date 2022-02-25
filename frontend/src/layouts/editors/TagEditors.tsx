import { defineComponent, PropType } from "vue"
import GridImage from "@/components/elements/GridImage"
import { SimpleIllust } from "@/functions/adapter-http/impl/illust"
import { useMessageBox } from "@/services/module/message-box"
import { useDroppable } from "@/services/global/drag"
import style from "./TagEditors.module.scss"

export const TagExampleEditor = defineComponent({
    props: {
        value: {type: Array as PropType<SimpleIllust[]>, required: true},
        showSaveButton: Boolean
    },
    emits: {
        updateValue: (_: SimpleIllust[]) => true,
        save: () => true
    },
    setup(props, { emit }) {
        const messageBox = useMessageBox()

        const onDeleteItem = (i: number) => () => {
            emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
        }

        const { isDragover, ...dropEvents } = useDroppable("illusts", illusts => {
            const forbidden: number[] = []
            const append: SimpleIllust[] = []
            for (const illust of illusts) {
                if(illust.type === "COLLECTION") {
                    forbidden.push(illust.id)
                }else if(props.value.find(i => i.id === illust.id) === undefined) {
                    append.push({id: illust.id, thumbnailFile: illust.thumbnailFile})
                }
            }
            if(forbidden.length) messageBox.showOkMessage("prompt", "图库集合不能用作示例。", `错误的项目: ${forbidden.join(", ")}`)
            if(append.length) emit("updateValue", [...props.value, ...append])
        })

        return () => <>
            <GridImage value={props.value.map(e => e.thumbnailFile)} columnNum={1} aspect={1.5} radius="std" boxShadow={true}
                       eachSlot={(createImg, file, index) => <>
                {createImg(file)}
                <button class={["button", "square", "is-small", "is-white", style.deleteButton]} onClick={onDeleteItem(index)}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
            </>}/>
            <div class={style.dropArea} {...dropEvents}>
                <div class={{[style.dropping]: isDragover.value}}>拖动图像到此处以添加示例</div>
            </div>
            <button class="button is-white is-small has-text-link w-100 mt-1" onClick={() => emit("save")}>
                <span class="icon"><i class="fa fa-edit"/></span><span>保存示例</span>
            </button>
        </>
    }
})
