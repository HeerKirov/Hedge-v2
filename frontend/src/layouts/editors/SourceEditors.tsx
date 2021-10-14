import { defineComponent, PropType, reactive, ref, watch } from "vue"
import Input from "@/components/forms/Input"
import NumberInput from "@/components/forms/NumberInput"
import { useMessageBox } from "@/functions/module/message-box"
import { SourceTag } from "@/functions/adapter-http/impl/source-tag-mapping"
import style from "./SourceEditors.module.scss"

export const SourceTagEditor = defineComponent({
    props: {
        value: {type: Array as PropType<readonly SourceTag[]>, required: true}
    },
    emits: {
        updateValue: (_: SourceTag[]) => true
    },
    setup(props, { emit }) {
        const messageBox = useMessageBox()
        const selected = ref<"creating" | number>()

        const updateValue = (v: SourceTag) => {
            if(v.name === "") {
                messageBox.showOkMessage("prompt", "不合法的名称。", "基准名称不能为空。")
                return false
            }else if(props.value.find((t, i) => v.name === t.name && selected.value !== i)) {
                messageBox.showOkMessage("prompt", "该名称已存在。", "在同一列表中创建了重名的标签。")
                return false
            }
            if(selected.value === "creating") {
                emit("updateValue", [...props.value, v])
            }else if(selected.value !== undefined) {
                emit("updateValue", [...props.value.slice(0, selected.value), v, ...props.value.slice(selected.value + 1)])
            }
            return true
        }
        const del = () => {
            if(typeof selected.value === "number") {
                emit("updateValue", [...props.value.slice(0, selected.value), ...props.value.slice(selected.value + 1)])
                selected.value = undefined
            }
        }

        return () => <div class={style.sourceTagEditor}>
            <div class={style.list}>
                {props.value.map((tag, i) => <SourceTagEditorItem value={tag} onClick={() => selected.value = i} selected={i === selected.value}/>)}
                <SourceTagEditorAddButton onClick={() => selected.value = "creating"} selected={selected.value === "creating"}/>
            </div>
            {selected.value !== undefined && <div class={style.editor}>
                <SourceTagEditorPanel value={selected.value === "creating" ? undefined : props.value[selected.value]} onUpdateValue={updateValue} onDelete={del}/>
            </div>}
        </div>
    }
})

const SourceTagEditorPanel = defineComponent({
    props: {
        value: Object as PropType<SourceTag>,
        onUpdateValue: Function as PropType<(_: SourceTag) => boolean>
    },
    emits: {
        delete: () => true
    },
    setup(props, { emit }) {
        const creating = ref(false)
        const form = reactive({name: "", displayName: "", type: ""})

        watch(() => props.value, v => {
            form.name = v?.name ?? ""
            form.displayName = v?.displayName ?? ""
            form.type = v?.type ?? ""
            creating.value = !v
        }, {immediate: true})

        const updateValue = () => {
            const ok = props.onUpdateValue?.({
                name: form.name.trim(),
                displayName: form.displayName.trim() || null,
                type: form.type.trim()
            })
            if(ok) {
                form.name = ""
                form.displayName = ""
                form.type = ""
            }
        }
        const del = () => emit("delete")

        return () => <div class="block m-2 p-3">
            <Input class="is-fullwidth is-small mb-1" placeholder="基准名称" value={form.name} onUpdateValue={v => form.name = v ?? ""}/>
            <Input class="is-fullwidth is-small mb-1" placeholder="标示名称" value={form.displayName} onUpdateValue={v => form.displayName = v ?? ""}/>
            <Input class="is-fullwidth is-small mb-2" placeholder="分类" value={form.type} onUpdateValue={v => form.type = v ?? ""}/>
            <button class="button is-small is-shallow-bg" onClick={updateValue}>
                <span class="icon"><i class="fa fa-check"/></span><span>确定</span>
            </button>
            {!creating.value && <button class="button is-small is-shallow-bg has-text-danger float-right" onClick={del}>
                <span class="icon"><i class="fa fa-trash"/></span><span>删除</span>
            </button>}
        </div>
    }
})

function SourceTagEditorItem({ value, selected }: {value: SourceTag, selected?: boolean}) {
    return <a class={selected ? "px-1 mr-1 has-bg-link has-text-white has-radius-small" : "px-1 mr-1"}>·<b>{value.name}</b></a>
}

function SourceTagEditorAddButton({ selected }: {selected?: boolean}) {
    return <a class={selected ? "px-1 mr-1 has-bg-link has-text-white has-radius-small" : "px-1 mr-1"}><i class="fa fa-plus mr-1"/>添加</a>
}

export const SourcePoolEditor = defineComponent({
    props: {
        value: {type: Array as PropType<readonly string[]>, required: true}
    },
    emits: {
        updateValue: (_: string[]) => true
    },
    setup(props, { emit }) {
        const showAddInput = ref(false)

        const add = (v: string) => {
            if(v) {
                emit("updateValue", [...props.value, v])
            }
            showAddInput.value = false
        }
        const update = (i: number, v: string) => {
            if(v) {
                emit("updateValue", [...props.value.slice(0, i), v, ...props.value.slice(i + 1)])
            }else{
                emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
            }
        }

        return () => <div class="p-2">
            {props.value.map((item, i) => <div>
                <Input class="is-fullwidth mb-1" value={item} onUpdateValue={v => update(i, v)}/>
            </div>)}
            {showAddInput.value && <Input class="is-fullwidth mb-1" onUpdateValue={v => add(v)}/>}
            <button class="button w-100" onClick={() => showAddInput.value = true}><span class="icon"><i class="fa fa-plus"/></span><span>添加行</span></button>
        </div>
    }
})

export const SourceRelationEditor = defineComponent({
    props: {
        value: {type: Array as PropType<readonly number[]>, required: true}
    },
    emits: {
        updateValue: (_: number[]) => true
    },
    setup(props, { emit }) {
        const showAddInput = ref(false)

        const add = (v: number) => {
            if(v) {
                emit("updateValue", [...props.value, v])
            }
            showAddInput.value = false
        }
        const update = (i: number, v: number) => {
            if(v) {
                emit("updateValue", [...props.value.slice(0, i), v, ...props.value.slice(i + 1)])
            }else{
                emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
            }
        }

        return () => <div class="p-2">
            {props.value.map((item, i) => <div>
                <NumberInput class="is-fullwidth mb-1" value={item} onUpdateValue={v => update(i, v)}/>
            </div>)}
            {showAddInput.value && <NumberInput class="is-fullwidth mb-1" onUpdateValue={v => add(v)}/>}
            <button class="button w-100" onClick={() => showAddInput.value = true}><span class="icon"><i class="fa fa-plus"/></span><span>添加行</span></button>
        </div>
    }
})
