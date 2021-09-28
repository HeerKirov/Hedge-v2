import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import { SourceTagEditor, SourcePoolEditor, SourceRelationEditor } from "@/layouts/editor-components"
import { installEditorData, useEditorData } from "./inject"
import style from "./style.module.scss"


export default defineComponent({
    setup() {
        installEditorData()

        return () => <div class={style.panelOfSource}>
            <Content/>
            <ToolBar/>

        </div>
    }
})

const Content = defineComponent({
    setup() {
        const { data, set } = useEditorData()

        return () => <div class={style.content}>
            <div class="mt-2">
                <span class="label">标题</span>
                <Input class="is-width-large" value={data.title} onUpdateValue={v => set("title", v)} refreshOnInput={true}/>
            </div>
            <div class="mt-2">
                <span class="label">描述</span>
                <Textarea value={data.description} onUpdateValue={v => set("description", v)} refreshOnInput={true}/>
            </div>
            <div class="mt-2">
                <span class="label">标签</span>
                <SourceTagEditor value={data.tags} onUpdateValue={v => set("tags", v)}/>
            </div>
            <div class="flex mt-2">
                <div class="is-width-60">
                    <span class="label">集合</span>
                    <SourcePoolEditor value={data.pools} onUpdateValue={v => set("pools", v)}/>
                </div>
                <div class="is-width-40">
                    <span class="label">父关联关系</span>
                    <SourceRelationEditor value={data.parents} onUpdateValue={v => set("parents", v)}/>
                    <span class="label">子关联关系</span>
                    <SourceRelationEditor value={data.children} onUpdateValue={v => set("children", v)}/>
                </div>
            </div>
        </div>
    }
})

const ToolBar = defineComponent({
    setup() {
        const { save, canSave } = useEditorData()

        return () => <div class={style.toolBar}>
            <button class="button is-link float-right" disabled={!canSave.value} onClick={save}>
                <span class="icon"><i class="fa fa-save"/></span><span>保存</span>
            </button>
        </div>
    }
})
