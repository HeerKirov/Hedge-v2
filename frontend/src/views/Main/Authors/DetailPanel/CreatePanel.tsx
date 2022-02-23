import { defineComponent, ref, watch } from "vue"
import TopBarTransparentLayout from "@/layouts/layouts/TopBarTransparentLayout"
import { DetailAuthor, AuthorCreateForm, AuthorExceptions, AuthorType } from "@/functions/adapter-http/impl/author"
import { useLocalStorageWithDefault } from "@/functions/app"
import { useMessageBox } from "@/functions/module/message-box"
import { useObjectCreator } from "@/functions/utils/endpoints/object-creator"
import { checkTagName } from "@/utils/check"
import { patchMappingSourceTagToForm } from "@/utils/translator"
import FormEditor, { FormEditorData } from "./FormEditor"
import { useAuthorContext } from "../inject"

export default defineComponent({
    setup() {
        const message = useMessageBox()
        const { createMode, endpoint, closePane } = useAuthorContext()
        const defaultType = useLocalStorageWithDefault<AuthorType>("author/default-type", "UNKNOWN")

        const form = ref<CreatorData>(mapCreatorData(createMode.value!, defaultType.value))

        function update<T extends CreatorProps>(key: T, value: CreatorData[T]) {
            form.value[key] = value
        }

        function updateFavorite(value: boolean) {
            form.value.favorite = value
        }

        watch(createMode, template => {
            if(template != null) {
                form.value = mapCreatorData(template, defaultType.value)
            }
        })

        const creator = useObjectCreator({
            form,
            create: httpClient => httpClient.author.create,
            mapForm: mapFromCreatorData,
            beforeCreate(form) {
                if(!checkTagName(form.name)) {
                    message.showOkMessage("prompt", "不合法的名称。", "名称不能为空，且不能包含 ` \" ' . | 字符。")
                    return false
                }
                for(const otherName of form.otherNames) {
                    if(!checkTagName(otherName)) {
                        message.showOkMessage("prompt", "不合法的别名。", "别名不能为空，且不能包含 ` \" ' . | 字符。")
                        return false
                    }
                }
                for(const link of form.links) {
                    if(!link.title.trim() || !link.link.trim()) {
                        message.showOkMessage("prompt", "不合法的链接内容。", "链接的标题和内容不能为空。")
                        return false
                    }
                }
            },
            afterCreate() {
                defaultType.value = form.value.type
                closePane()
                endpoint.refresh()
            },
            handleError(e: AuthorExceptions["create"]) {
                if(e.code === "ALREADY_EXISTS") {
                    message.showOkMessage("prompt", "该名称已存在。")
                }else if(e.code === "NOT_EXIST") {
                    const [, id] = e.info
                    message.showOkMessage("error", "选择的注解不存在。", `错误项: ${id}`)
                }else if(e.code === "NOT_SUITABLE") {
                    const [, ids] = e.info
                    const content = ids.map(id => form.value.annotations?.find(i => i.id === id)?.name ?? "unknown").join(", ")
                    message.showOkMessage("error", "选择的注解不可用。", `选择的注解的导出目标设置使其无法导出至当前主题类型。错误项: ${content}`)
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
        const { closePane } = useAuthorContext()

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

function mapCreatorData(mode: Partial<DetailAuthor>, defaultType: AuthorType): CreatorData {
    return {
        name: mode.name ?? "",
        otherNames: mode.otherNames ?? [],
        type: mode.type ?? defaultType,
        description: mode.description ?? "",
        keywords: mode.keywords ?? [],
        links: mode.links ?? [],
        favorite: mode.favorite ?? false,
        annotations: mode.annotations ?? [],
        score: mode.score ?? null,
        mappingSourceTags: mode.mappingSourceTags ?? []
    }
}

function mapFromCreatorData(form: CreatorData): AuthorCreateForm {
    return {
        name: form.name,
        otherNames: form.otherNames,
        type: form.type,
        description: form.description,
        keywords: form.keywords,
        links: form.links,
        favorite: form.favorite,
        annotations: form.annotations.map(a => a.id),
        score: form.score,
        mappingSourceTags: patchMappingSourceTagToForm(form.mappingSourceTags, [])
    }
}

export interface CreatorData extends FormEditorData {
    favorite: boolean
}

type CreatorProps = keyof CreatorData
