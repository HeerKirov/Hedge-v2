import { computed, defineComponent, PropType } from "vue"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { useSettingSite } from "@/functions/api/setting"

export default defineComponent({
    props: {
        source: null as any as PropType<string | null>,
        sourceId: null as any as PropType<number | null>,
        sourcePart: null as any as PropType<number | null>
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const { data: siteList } = useSettingSite()

        const siteSelectItems = computed(() => siteList.value.map(s => ({name: s.title, value: s.name})).concat(NOT_SELECT_ITEM))

        const site = computed(() => props.source != null ? siteList.value.find(s => s.name === props.source) ?? null : null)

        const updateSource = (v: string | undefined) => {
            if(v === "" || v === undefined) {
                emit("updateValue", {source: null, sourceId: null, sourcePart: null})
            }else{
                const site = siteList.value.find(s => s.name === v)
                if(site && !site.hasSecondaryId) {
                    emit("updateValue", {source: v, sourceId: props.sourceId, sourcePart: null})
                }else{
                    emit("updateValue", {source: v, sourceId: props.sourceId, sourcePart: props.sourcePart})
                }
            }
        }
        const updateId = (v: string | undefined) => emit("updateValue", {source: props.source, sourceId: v ? parseInt(v) : null, sourcePart: props.sourcePart})
        const updatePart = (v: string | undefined) => emit("updateValue", {source: props.source, sourceId: props.sourceId, sourcePart: v ? parseInt(v) : null})

        return () => <div>
            <p class="mb-1">
                <Select items={siteSelectItems.value} value={props.source ?? ""} onUpdateValue={updateSource}/>
            </p>
            {props.source && <Input class="is-small is-width-small mr-1" placeholder="来源ID" value={props.sourceId?.toString()} onUpdateValue={updateId} refreshOnInput={true}/>}
            {site.value?.hasSecondaryId && <Input class="is-small is-width-one-third" placeholder="分P" value={props.sourcePart?.toString()} onUpdateValue={updatePart} refreshOnInput={true}/>}
        </div>
    }
})

const NOT_SELECT_ITEM = {name: "未选择", value: ""}
