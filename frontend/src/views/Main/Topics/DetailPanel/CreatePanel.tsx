import { defineComponent, ref, watch } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { useMessageBox } from "@/functions/module/message-box"
import { DetailTopic, TopicCreateForm, TopicExceptions } from "@/functions/adapter-http/impl/topic"
import { IdResponse } from "@/functions/adapter-http/impl/generic"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { checkTagName } from "@/utils/check"
import FormEditor, { FormEditorData } from "./FormEditor"
import { useTopicContext } from "../inject"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { createMode, endpoint, openDetailPane } = useTopicContext()

        const form = ref<CreatorData>(mapCreatorData(createMode.value!))

        function update<T extends CreatorProps>(key: T, value: CreatorData[T]) {
            form.value[key] = value
        }

        function updateFavorite(value: boolean) {
            form.value.favorite = value
        }

        watch(createMode, template => {
            if(template != null) {
                form.value = mapCreatorData(template)
            }
        })

        const creator = useObjectCreator({
            form,
            create: httpClient => httpClient.topic.create,
            mapForm: mapFromCreatorData,
            beforeCreate(form) {
                if(!checkTagName(form.name)) {
                    message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                    return false
                }
                for(const otherName of form.otherNames) {
                    if(!checkTagName(otherName)) {
                        message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                        return
                    }
                }
                for(const link of form.links) {
                    if(!link.title.trim() || !link.link.trim()) {
                        message.showOkMessage("prompt", "不合法的链接内容。", "链接的标题和内容不能为空。")
                    }
                }
            },
            afterCreate(result: IdResponse) {
                openDetailPane(result.id)
                endpoint.refresh()
            },
            handleError(e: TopicExceptions["create"]) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                }else if(e.code === "NOT_EXIST") {
                    const [type, id] = e.info
                    if(type === "annotations") {
                        message.showOkMessage("error", "选择的注解不存在。", `错误项: ${id}`)
                    }else if(type === "parentId") {
                        message.showOkMessage("error", "选择的父主题不存在。", `错误项: ${id}`)
                    }else{
                        message.showOkMessage("error", `选择的资源${type}不存在。`, `错误项: ${id}`)
                    }
                }else if(e.code === "NOT_SUITABLE") {
                    const [, ids] = e.info
                    const content = ids.map(id => form.value.annotations?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                    message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至当前主题类型。错误项: ${content}`)
                }else if(e.code === "RECURSIVE_PARENT") {
                    message.showOkMessage("prompt", "无法应用此父主题。", "此父主题与当前主题存在闭环。")
                }else if(e.code === "ILLEGAL_CONSTRAINT") {
                    message.showOkMessage("prompt", "无法应用主题类型。", "当前主题的类型与其与父主题/子主题不能兼容。考虑更改父主题，或更改当前主题的类型。")
                }else{
                    return e
                }
            }
        })

        return () => <TopBarTransparentLayout paddingForTopBar={true} scrollable={true} v-slots={{
            topBar: () => <TopBarContent onSave={creator.save} favorite={form.value.favorite} onUpdateFavorite={updateFavorite}/>,
            default: () => <FormEditor data={form.value} onUpdate={update}/>
        }}/>
    }
})

const TopBarContent = defineComponent({
    props: {
        favorite: {type: Boolean, required: true}
    },
    emits: ["save", "updateFavorite"],
    setup(props, { emit }) {
        const { closePane } = useTopicContext()

        const switchFavorite = () => emit("updateFavorite", !props.favorite)

        const save = () => emit("save")

        return () => <div class="middle-layout">
            <div class="layout-container">
                <button class="square button no-drag radius-large is-white mr-1" onClick={closePane}>
                    <span class="icon"><i class="fa fa-times"/></span>
                </button>
            </div>
            <div class="layout-container">
                <button class={`square button no-drag radius-large is-white ${props.favorite ? "has-text-danger" : "has-text-grey"}`} onClick={switchFavorite}>
                    <span class="icon"><i class="fa fa-heart"/></span>
                </button>
                <div class="separator"/>
                <button class="button no-drag radius-large is-white" onClick={save}>
                    <span class="icon"><i class="fa fa-check"/></span>
                    <span>保存</span>
                </button>
            </div>
        </div>
    }
})

function mapCreatorData(mode: Partial<DetailTopic>): CreatorData {
    return {
        name: mode.name ?? "",
        otherNames: mode.otherNames ?? [],
        parent: mode.parent ?? null,
        type: mode.type ?? "UNKNOWN",
        description: mode.description ?? "",
        keywords: mode.keywords ?? [],
        links: mode.links ?? [],
        favorite: mode.favorite ?? false,
        annotations: mode.annotations ?? [],
        score: mode.score ?? null,
        mappingSourceTags: mode.mappingSourceTags ?? []
    }
}

function mapFromCreatorData(form: CreatorData): TopicCreateForm {
    return {
        name: form.name,
        otherNames: form.otherNames,
        parentId: form.parent?.id,
        type: form.type,
        description: form.description,
        keywords: form.keywords,
        links: form.links,
        favorite: form.favorite,
        annotations: form.annotations.map(a => a.id),
        score: form.score
    }
}

export interface CreatorData extends FormEditorData {
    favorite: boolean
}

type CreatorProps = keyof CreatorData
