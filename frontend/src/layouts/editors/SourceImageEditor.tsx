import { computed, defineComponent, PropType, reactive, Ref, watch } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import { SourcePoolEditor, SourceRelationEditor, SourceTagEditor } from "@/layouts/editors/SourceEditors"
import { SourceTag, SourceTagForm } from "@/functions/adapter-http/impl/source-tag-mapping"
import { SourceImageUpdateForm } from "@/functions/adapter-http/impl/source-image"
import { patchSourceTagToForm } from "@/utils/translator";

export interface SourceImageEditorData {
    title: string,
    description: string,
    tags: SourceTag[],
    pools: string[],
    relations: number[]
}

export type SourceImageEditorSetData = (form: SourceImageUpdateForm) => void

export type SourceImageEditorSetProperty = <K extends keyof SourceImageEditorData>(key: K, value: SourceImageEditorData[K]) => void

export const SourceImageEditor = defineComponent({
    props: {
        data: {type: Object as PropType<SourceImageEditorData>, required: true},
        setProperty: Function as PropType<SourceImageEditorSetProperty>
    },
    setup(props) {
        function set<K extends keyof SourceImageEditorData>(key: K, value: SourceImageEditorData[K]) {
            props.setProperty?.(key, value)
        }

        return () => <>
            <div class="mt-2">
                <span class="label">标题</span>
                <Input class="is-width-large" value={props.data.title} onUpdateValue={v => set("title", v)} refreshOnInput={true}/>
            </div>
            <div class="mt-2">
                <span class="label">描述</span>
                <Textarea value={props.data.description} onUpdateValue={v => set("description", v)} refreshOnInput={true}/>
            </div>
            <div class="mt-2">
                <span class="label">标签</span>
                <SourceTagEditor value={props.data.tags} onUpdateValue={v => set("tags", v)}/>
            </div>
            <div class="flex mt-2">
                <div class="is-width-60">
                    <span class="label">集合</span>
                    <SourcePoolEditor value={props.data.pools} onUpdateValue={v => set("pools", v)}/>
                </div>
                <div class="is-width-40">
                    <span class="label">关联关系</span>
                    <SourceRelationEditor value={props.data.relations} onUpdateValue={v => set("relations", v)}/>
                </div>
            </div>
        </>
    }
})

export function useSourceImageEditorData(data: Ref<SourceImageEditorData | null | undefined> | null | undefined, setData: SourceImageEditorSetData) {
    const editorData = reactive<SourceImageEditorData>({
        title: "",
        description: "",
        tags: [],
        pools: [],
        relations: []
    })

    const changed = reactive({title: false, description: false, tags: false, pools: false, relations: false})

    const anyChanged = computed(() => changed.title || changed.description || changed.tags || changed.relations || changed.pools)

    function set<K extends keyof (typeof editorData)>(key: K, value: (typeof editorData)[K]) {
        editorData[key] = value
        changed[key] = true
    }

    if(data !== null && data !== undefined) {
        watch(data, d => {
            editorData.title = d?.title ?? ""
            editorData.description = d?.description ?? ""
            editorData.tags = d?.tags ? [...d.tags] : []
            editorData.pools = d?.pools ? [...d.pools] : []
            editorData.relations = d?.relations ? [...d.relations] : []
            changed.title = false
            changed.description = false
            changed.tags = false
            changed.pools = false
            changed.relations = false
        }, {immediate: true})
    }

    const save = async () => {
        setData({
            title: changed.title ? editorData.title ?? null : undefined,
            description: changed.description ? editorData.description ?? null : undefined,
            tags: changed.tags ? patchSourceTagToForm(editorData.tags, data?.value?.tags ?? []) : undefined,
            pools: changed.pools ? editorData.pools : undefined,
            relations: changed.relations ? editorData.relations : undefined
        })
    }

    return {data: editorData, set, save, anyChanged}
}
