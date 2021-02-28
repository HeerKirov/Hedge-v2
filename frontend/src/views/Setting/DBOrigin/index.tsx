import { computed, defineComponent, ref, watch } from "vue"
import { useSettingSite, useSettingSourceSpider } from "@/functions/server-api/setting"
import { Site } from "@/functions/adapter-http/impl/setting-source"
import Input from "@/components/Input"
import CheckBox from "@/components/CheckBox"
import SelectList from "@/components/SelectList"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        return () => <div class={style.root}>
            <p class="mb-2 is-size-medium">来源站点</p>
            <SiteBoard/>
            <p class="mt-3 mb-2 is-size-medium">爬虫选项</p>
            <SpiderBoard/>
        </div>
    }
})

const SiteBoard = defineComponent({
    props: {
    },
    emits: ["update"],
    setup(props, { emit }) {
        const { data, createItem, updateItem, deleteItem } = useSettingSite()

        const sites = computed(() => data.value.map(site => ({name: site.title, value: site.name})))

        const selected = ref<string>()
        const detail = ref<Site | "CREATE_MODE" | null>(null)
        const updateLoading = ref(false)

        const select = (v: string | undefined) => {
            selected.value = v
            detail.value = data.value.find(s => s.name === v) ?? null
        }
        const openCreateMode = () => {
            selected.value = undefined
            detail.value = "CREATE_MODE"
        }
        const createSite = async (site: Site) => {
            updateLoading.value = true
            if(await createItem(site)) {
                select(site.name)
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
                <SelectList class={style.leftList} value={selected.value} items={sites.value} onUpdateValue={select} allowCancel={false}/>
                <div class={style.leftBottom}>
                    <button class={`button is-small w-100 ${detail.value === "CREATE_MODE" ? "is-link" : "is-white"}`} onClick={openCreateMode}><span class="icon"><i class="fa fa-plus"/></span><span>新建站点</span></button>
                </div>
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

        const save = () => {
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
            <Input class={{"fullwidth": true, "is-danger": error.value.name}} disabled={!props.createMode} value={data.value.name} onUpdateValue={v => data.value.name = v}/>
            <label class="label">站点名称</label>
            <Input class={{"fullwidth": true, "is-danger": error.value.title}} value={data.value.title} onUpdateValue={v => data.value.title = v}/>
            <CheckBox disabled={!props.createMode} class="mt-2" value={data.value.hasSecondaryId} onUpdateValue={v => data.value.hasSecondaryId = v}>站点拥有二级id</CheckBox>
            <div class="group mt-3">
                {props.createMode
                    ? <button class="button is-small is-success" onClick={save}><span class="icon"><i class="fa fa-save"/></span><span>添加站点</span></button>
                    : <button class="button is-small is-info" onClick={save}><span class="icon"><i class="fa fa-save"/></span><span>保存更改</span></button>
                }
                {!props.createMode && <button class="button is-small is-danger" onClick={deleteItem}><span class="icon"><i class="fa fa-trash"/></span><span>删除</span></button>}
            </div>
        </div>
    }
})

const SpiderBoard = defineComponent({
    props: {
    },
    emits: ["update"],
    setup(props, { emit }) {
        const { loading, data } = useSettingSourceSpider()

        return () => loading.value ? <div/> : <div class={style.siteBoard}>
            <div class={style.left}>

            </div>
            <div class={style.right}>

            </div>
        </div>
    }
})