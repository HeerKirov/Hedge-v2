import { defineComponent, PropType, reactive } from "vue"
import Input from "@/components/forms/Input"
import { Link } from "@/functions/adapter-http/impl/generic"
import { useMessageBox } from "@/functions/document/message-box"
import { onKeyEnter } from "@/utils/events"


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

        const newValue = (link: Link) => {
            emit("updateValue", [...props.value, link])
        }

        return () => <>
            {props.value.map((link, i) => <div class="flex mb-1">
                <Input class="is-small is-width-25 mr-1" value={link.title} onUpdateValue={onUpdateTitle(i)}/>
                <Input class="is-small is-width-75 mr-1" value={link.link} onUpdateValue={onUpdateLink(i)}/>
                <button class="square button is-white is-small is-not-shrink is-not-grow" onClick={onDelete(i)}><span class="icon"><i class="fa fa-times"/></span></button>
            </div>)}
            <LinkNewBox onNew={newValue}/>
        </>
    }
})

const LinkNewBox = defineComponent({
    emits: {
        new(_: Link) { return true }
    },
    setup(_, { emit }) {
        const message = useMessageBox()
        const text = reactive<Link>({title: "", link: ""})

        const add = () => {
            const title = text.title.trim(), link = text.link.trim()

            if(title && link) {
                emit("new", {title, link})
                text.title = ""
                text.link = ""
            }else{
                message.showOkMessage("prompt", "不合法的链接内容。", "链接的标题和内容不能为空。")
            }
        }

        return () => <div class="flex">
            <Input class="is-small is-width-25 mr-1" placeholder="新链接标题" value={text.title} onUpdateValue={v => text.title = v} refreshOnInput={true} onKeypress={onKeyEnter(add)}/>
            <Input class="is-small is-width-75 mr-1" placeholder="新链接内容" value={text.link} onUpdateValue={v => text.link = v} refreshOnInput={true} onKeypress={onKeyEnter(add)}/>
            <button class="square button is-white is-small is-not-shrink is-not-grow" onClick={add}><span class="icon"><i class="fa fa-plus"/></span></button>
        </div>
    }
})
