import { computed, defineComponent, PropType } from "vue"
import Input from "@/components/forms/Input"
import Select from "@/components/forms/Select"
import { useSettingSite } from "@/services/api/setting"

export interface SourceIdentity {source: string | null, sourceId: number | null, sourcePart: number | null}

export const SourceIdentityEditor = defineComponent({
    props: {
        source: {type: null as any as PropType<string | null>, required: true},
        sourceId: {type: null as any as PropType<number | null>, required: true},
        sourcePart: {type: null as any as PropType<number | null>, required: true}
    },
    emits: {
        updateValue: (_: SourceIdentity) => true
    },
    setup(props, { emit }) {
        const { data: siteList } = useSettingSite()

        const site = computed(() => props.source != null ? siteList.value.find(s => s.name === props.source) ?? null : null)

        const updateSource = (v: string | null) => {
            if(v === "__UNDEFINED" || v === null) {
                emit("updateValue", {source: null, sourceId: null, sourcePart: null})
            }else{
                const site = siteList.value.find(s => s.name === v)
                emit("updateValue", {source: v, sourceId: props.sourceId, sourcePart: site && !site.hasSecondaryId ? null : props.sourcePart})
            }
        }
        const updateId = (v: string | undefined) => emit("updateValue", {source: props.source, sourceId: v ? parseInt(v) : null, sourcePart: props.sourcePart})
        const updatePart = (v: string | undefined) => emit("updateValue", {source: props.source, sourceId: props.sourceId, sourcePart: v ? parseInt(v) : null})

        return () => <div>
            <p class="mb-1"><SourceSiteSelect value={props.source} onUpdateValue={updateSource}/></p>
            {props.source && <Input class="is-small is-width-small mr-1" placeholder="来源ID" value={props.sourceId?.toString()} onUpdateValue={updateId} refreshOnInput={true}/>}
            {site.value?.hasSecondaryId && <Input class="is-small is-width-one-third" placeholder="分P" value={props.sourcePart?.toString()} onUpdateValue={updatePart} refreshOnInput={true}/>}
        </div>
    }
})

export const SourceKeyEditor = defineComponent({
    props: {
        source: {type: null as any as PropType<string | null>, required: true},
        sourceId: {type: null as any as PropType<number | null>, required: true}
    },
    emits: {
        updateValue: (_: {source: string | null, sourceId: number | null}) => true
    },
    setup(props, { emit }) {
        const updateSource = (v: string | null) => {
            if(v === "__UNDEFINED" || v === null) {
                emit("updateValue", {source: null, sourceId: null})
            }else{
                emit("updateValue", {source: v, sourceId: props.sourceId})
            }
        }

        const updateId = (v: string | undefined) => emit("updateValue", {source: props.source, sourceId: v ? parseInt(v) : null})

        return () => <div>
            <SourceSiteSelect value={props.source} onUpdateValue={updateSource}/>
            {props.source && <Input class="is-width-small ml-1" placeholder="来源ID" value={props.sourceId?.toString()} onUpdateValue={updateId} refreshOnInput={true}/>}
        </div>
    }
})

export const SourceSiteSelect = defineComponent({
    props: {
        value: {type: null as any as PropType<string | null>, required: true}
    },
    emits: {
        updateValue: (_: string | null) => true
    },
    setup(props, { emit }) {
        const { data: siteList } = useSettingSite()

        const siteSelectItems = computed(() => [NOT_SELECT_ITEM, ...siteList.value.map(s => ({name: s.title, value: s.name}))])

        const updateSource = (v: string | undefined) => {
            if(v === "__UNDEFINED" || v === undefined) {
                emit("updateValue", null)
            }else{
                emit("updateValue", v)
            }
        }

        return () => <Select items={siteSelectItems.value} value={props.value ?? "__UNDEFINED"} onUpdateValue={updateSource}/>
    }
})

const NOT_SELECT_ITEM = {name: "未选择", value: "__UNDEFINED"}
