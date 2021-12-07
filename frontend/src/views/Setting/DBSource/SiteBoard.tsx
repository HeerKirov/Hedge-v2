import { computed, defineComponent, ref, watch } from "vue"
import { Site } from "@/functions/adapter-http/impl/setting-source"
import SelectList from "@/components/forms/SelectList"
import Input from "@/components/forms/Input"
import CheckBox from "@/components/forms/CheckBox"
import { useSettingSite } from "@/functions/api/setting"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const { data, createItem, updateItem, deleteItem } = useSettingSite()

        const sites = computed(() => data.value.map(site => ({name: site.title, value: `_${site.name}`})).concat([{name: "新建站点…", value: "CREATE"}]))

        const selected = ref<string>()
        const detail = ref<Site | "CREATE_MODE" | null>(null)
        const updateLoading = ref(false)

        const select = (v: string) => {
            if(v.startsWith("_")) {
                const siteName = v.substr(1)
                detail.value = data.value.find(s => s.name === siteName) ?? null
            }else if(v === "CREATE") {
                detail.value = "CREATE_MODE"
            }
            selected.value = v
        }
        const createSite = async (site: Site) => {
            updateLoading.value = true
            if(await createItem(site)) {
                select(`_${site.name}`)
            }
            updateLoading.value = false
        }
        const updateSite = async (name: string, title: string) => {
            updateLoading.value = true
            await updateItem(name, title)
            updateLoading.value = false
        }
        const deleteSite = async (name: string) => {
            updateLoading.value = true
            if(await deleteItem(name)) {
                detail.value = null
            }
            updateLoading.value = false
        }

        return () => <div class={style.siteBoard}>
            <div class={style.left}>
                <SelectList class="h-100" value={selected.value} items={sites.value} onUpdateValue={select} allowCancel={false}/>
            </div>
            <div class={style.right}>
                {detail.value != null && (detail.value === "CREATE_MODE"
                        ? <SiteEditor createMode={true} name={""} title={""} hasSecondaryId={false} onCreate={createSite} disabled={updateLoading.value}/>
                        : <SiteEditor {...detail.value} onSave={updateSite} onDelete={deleteSite} disabled={updateLoading.value}/>
                )}
            </div>
        </div>
    }
})

const SiteEditor = defineComponent({
    props: {
        name: String,
        title: String,
        hasSecondaryId: Boolean,
        createMode: {type: Boolean, default: false},
        disabled: {type: Boolean, default: false}
    },
    emits: ["save", "create", "delete"],
    setup(props, { emit }) {
        const data = ref({
            name: props.name ?? "",
            title: props.title ?? "",
            hasSecondaryId: props.hasSecondaryId ?? false
        })
        const error = ref({name: false, title: false})

        watch(() => props, p => {
            data.value = {
                name: p.name ?? "",
                title: p.title ?? "",
                hasSecondaryId: p.hasSecondaryId
            }
            error.value = {name: false, title: false}
        }, {deep: true})

        const saveItem = () => {
            if(!props.disabled) {
                error.value = {name: false, title: false}
                if(props.createMode) {
                    if(!data.value.name.trim()) {
                        error.value.name = true
                    }
                    if(!data.value.title.trim()) {
                        error.value.title = true
                    }
                    if(!error.value.name && !error.value.title) {
                        emit("create", {name: data.value.name, title: data.value.title, hasSecondaryId: data.value.hasSecondaryId})
                    }
                }else{
                    if(!data.value.title.trim()) {
                        error.value.title = true
                    }
                    if(!error.value.title) {
                        emit("save", data.value.name, data.value.title)
                    }
                }
            }
        }
        const deleteItem = () => {
            if(!props.disabled) {
                emit("delete", data.value.name)
            }
        }

        return () => <div class="block h-100">
            <label class="label">站点标识名</label>
            <Input class={{"is-fullwidth": true, "is-danger": error.value.name}} disabled={!props.createMode} value={data.value.name} onUpdateValue={v => data.value.name = v}/>
            <label class="label">站点名称</label>
            <Input class={{"is-fullwidth": true, "is-danger": error.value.title}} value={data.value.title} onUpdateValue={v => data.value.title = v}/>
            <CheckBox disabled={!props.createMode} class="mt-2" value={data.value.hasSecondaryId} onUpdateValue={v => data.value.hasSecondaryId = v}>站点拥有二级id</CheckBox>
            <div class="group mt-3">
                {props.createMode
                    ? <button class="button is-small is-success" onClick={saveItem}><span class="icon"><i class="fa fa-plus"/></span><span>添加站点</span></button>
                    : <button class="button is-small is-info" onClick={saveItem}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
                }
                {!props.createMode && <button class="square button is-small is-danger float-right" onClick={deleteItem}><span class="icon"><i class="fa fa-trash"/></span></button>}
            </div>
        </div>
    }
})
