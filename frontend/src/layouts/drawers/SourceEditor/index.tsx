import { computed, defineComponent, PropType } from "vue"
import { IllustExceptions, ImageOriginData, ImageOriginUpdateForm } from "@/functions/adapter-http/impl/illust"
import { SourceImageEditor, useSourceImageEditorData } from "@/layouts/editors"
import style from "./style.module.scss"

interface SetData {
    (form: ImageOriginUpdateForm, errorHandler?: (e: IllustExceptions["image.originData.update"]) => IllustExceptions["image.originData.update"] | void): Promise<boolean>
}

export default defineComponent({
    props: {
        data: {type: null as any as PropType<ImageOriginData | null>, required: true},
        setData: {type: Function as PropType<SetData>, required: true}
    },
    emits: {
        close: () => true
    },
    setup(props, { emit }) {
        const sourceData = computed(() => {
            if(props.data != null && props.data.source !== null && props.data.sourceId !== null) {
                return {
                    title: props.data.title,
                    description: props.data.description,
                    tags: props.data.tags,
                    pools: props.data.pools,
                    children: props.data.children,
                    parents: props.data.parents
                }
            }else{
                return null
            }
        })
        const { data, set, anyChanged, save } = useSourceImageEditorData(sourceData, async d => {
            if(await props.setData(d)) {
                emit("close")
            }
        })

        return () => <div class={style.panelOfSource}>
            <div class={style.content}>
                <SourceImageEditor data={data} setProperty={set}/>
            </div>
            <div class={style.toolBar}>
                <button class="button is-link float-right" disabled={!anyChanged.value} onClick={save}>
                    <span class="icon"><i class="fa fa-save"/></span><span>保存</span>
                </button>
            </div>
        </div>
    }
})
