import { defineComponent, PropType } from "vue"
import Input from "@/components/forms/Input"
import { Link } from "@/functions/adapter-http/impl/generic"

export default defineComponent({
    props: {
        value: {type: Array as PropType<Link[]>, required: true}
    },
    emits: {
        updateValue(_: Link[]) { return true }
    },
    setup(props, { emit }) {
        const onDelete = (i: number) => () => {
            emit("updateValue", [...props.value.slice(0, i), ...props.value.slice(i + 1)])
        }

        const onUpdateTitle = (i: number) => (v: string) => {
            emit("updateValue", [...props.value.slice(0, i), {title: v, link: props.value[i].link}, ...props.value.slice(i + 1)])
        }

        const onUpdateLink = (i: number) => (v: string) => {
            emit("updateValue", [...props.value.slice(0, i), {title: props.value[i].title, link: v}, ...props.value.slice(i + 1)])
        }

        const newValue = () => {
            emit("updateValue", [...props.value, {title: "", link: ""}])
        }

        return () => <>
            {props.value.map((link, i) => <div class="flex mb-1">
                <Input class="is-small is-width-25 mr-1" value={link.title} onUpdateValue={onUpdateTitle(i)}/>
                <Input class="is-small is-width-75 mr-1" value={link.link} onUpdateValue={onUpdateLink(i)}/>
                <button class="square button is-small is-not-shrink is-not-grow" onClick={onDelete(i)}><span class="icon"><i class="fa fa-times"/></span></button>
            </div>)}
            <button class="button w-100" onClick={newValue}><span class="icon"><i class="fa fa-plus"/></span><span>添加新链接</span></button>
        </>
    }
})
