import { computed, defineComponent, PropType, Ref } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import Select, { SelectItem } from "@/components/forms/Select"
import { AnnotationEditor, LinkEditor, OtherNameEditor, StarlightEditor, SourceTagMappingEditor } from "@/layouts/editors"
import { AnnotationTarget, SimpleAnnotation } from "@/functions/adapter-http/impl/annotations"
import { SourceMappingMetaItem } from "@/functions/adapter-http/impl/source-tag-mapping"
import { AuthorType } from "@/functions/adapter-http/impl/author"
import { Link } from "@/functions/adapter-http/impl/generic"
import { AUTHOR_TYPE_ENUMS, AUTHOR_TYPE_ICONS, AUTHOR_TYPE_NAMES } from "@/definitions/author"
import { arrays } from "@/utils/collections"

export default defineComponent({
    props: {
        data: {type: Object as PropType<FormEditorData>, required: true}
    },
    emits: {
        update<T extends FormEditorProps>(_: T, __: FormEditorData[T]) { return true }
    },
    setup(props, { emit }) {
        const setName = (v: string) => emit("update", "name", v)
        const setOtherNames = (v: string[]) => emit("update", "otherNames", v)
        const setType = (v: AuthorType) => emit("update", "type", v)
        const setKeywords = (v: string) => {
            const s = v.trim()
            const keywords = s ? s.split(/\s+/) : []
            emit("update", "keywords", keywords)
        }
        const setDescription = (v: string) => emit("update", "description", v)
        const setLinks = (v: Link[]) => emit("update", "links", v)
        const setScore = (v: number | null) => emit("update", "score", v)
        const setAnnotations = (v: SimpleAnnotation[]) => emit("update", "annotations", v)
        const setMappingSourceTags = (v: SourceMappingMetaItem[]) => emit("update", "mappingSourceTags", v)

        const annotationTarget: Ref<AnnotationTarget> = computed(() => props.data.type === "UNKNOWN" ? "TOPIC" : props.data.type)

        return () => <div class="container p-2">
            <div class="box mb-1">
                <div class="mt-2">
                    <span class="label">作者名称</span>
                    <Input class="is-fullwidth" value={props.data.name} onUpdateValue={setName}/>
                </div>
                <div class="flex mt-2">
                    <div class="is-width-60">
                        <span class="label">别名</span>
                        <OtherNameEditor value={props.data.otherNames} onUpdateValue={setOtherNames}/>
                    </div>
                </div>
                <div class="mt-2">
                    <span class="label">类型</span>
                    <span class="icon is-line-height-std mx-1">{TYPE_ICON_ELEMENTS[props.data.type]}</span>
                    <Select value={props.data.type} onUpdateValue={setType} items={TYPE_SELECT_ITEMS}/>
                </div>
                <div class="mt-2">
                    <span class="label">评分</span>
                    <StarlightEditor value={props.data.score} onUpdateValue={setScore}/>
                </div>
                <div class="mt-2">
                    <span class="label">注解</span>
                    <AnnotationEditor target={annotationTarget.value} value={props.data.annotations} onUpdateValue={setAnnotations}/>
                </div>
                <div class="mt-2">
                    <span class="label">描述关键字</span>
                    <Input class="is-fullwidth" value={props.data.keywords.join(" ")} onUpdateValue={setKeywords}/>
                </div>
                <div class="mt-2">
                    <span class="label">简介</span>
                    <Textarea class="is-fullwidth" value={props.data.description} onUpdateValue={setDescription}/>
                </div>
            </div>
            <div class="box">
                <span class="label">相关链接</span>
                <LinkEditor value={props.data.links} onUpdateValue={setLinks}/>
            </div>
            <div class="box">
                <span class="label">来源映射</span>
                <SourceTagMappingEditor value={props.data.mappingSourceTags} onUpdateValue={setMappingSourceTags} direction="horizontal"/>
            </div>
        </div>
    }
})

export interface FormEditorData {
    name: string
    otherNames: string[]
    type: AuthorType
    annotations: SimpleAnnotation[]
    keywords: string[]
    description: string
    links: Link[]
    score: number | null
    mappingSourceTags: SourceMappingMetaItem[]
}

type FormEditorProps = keyof FormEditorData

const TYPE_SELECT_ITEMS: SelectItem[] =
    Object.entries(AUTHOR_TYPE_NAMES).map(([value, name]) => ({name, value}))

const TYPE_ICON_ELEMENTS: {[type in AuthorType]: JSX.Element} =
    arrays.toMap(AUTHOR_TYPE_ENUMS, type => <i class={`fa fa-${AUTHOR_TYPE_ICONS[type]} mr-1`}/>)
