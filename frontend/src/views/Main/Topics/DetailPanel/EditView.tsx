import { defineComponent } from "vue"
import Input from "@/components/forms/Input"
import Textarea from "@/components/forms/Textarea"
import Select, { SelectItem } from "@/components/forms/Select"
import { TopicType } from "@/functions/adapter-http/impl/topic"
import { useTopicDetailContext } from "./inject"
import { TOPIC_TYPE_ENUMS, TOPIC_TYPE_ICONS, TOPIC_TYPE_NAMES } from "../define"
import style from "./style.module.scss"
import { arrays } from "@/utils/collections";

export default defineComponent({
    setup() {
        const { data, editor } = useTopicDetailContext()

        return () => <div class="container p-2">
            <div class="box mb-1">
                <div class="flex">
                    <div class="is-width-55 mr-2">
                        <div class="mt-2">
                            <span class="label">主题名称</span>
                            <Input class="is-fullwidth" value={data.value?.name}/>
                        </div>
                        <div class="mt-2">
                            <span class="label">别名</span>
                            <div class="flex">
                                <Input class="is-fullwidth is-small mr-1"/>
                                <button class="square button is-white is-small"><span class="icon"><i class="fa fa-trash"/></span></button>
                            </div>
                        </div>
                    </div>
                    <div class="is-width-45">
                        <div class="mt-2">
                            <span class="label">类型</span>
                            <span class="icon is-line-height-std mx-1">
                                {TYPE_ICON_ELEMENTS[data.value?.type ?? "UNKNOWN"]}
                            </span>
                            <Select value={data.value?.type} items={TYPE_SELECT_ITEMS}/>
                        </div>
                        <div class="mt-2">
                            <span class="label">父主题</span>
                            <span class="is-line-height-small mr-1">
                                <span class="tag">父主题</span>
                            </span>
                            <button class="square button is-white is-small"><span class="icon"><i class="fa fa-times"/></span></button>
                        </div>
                    </div>
                </div>
                <div class="mt-2">
                    <span class="label">描述关键字</span>
                    <Input class="is-fullwidth is-small"/>
                </div>
                <div class="mt-2">
                    <span class="label">简介</span>
                    <Textarea class="is-fullwidth" value={data.value?.description}/>
                </div>
            </div>
            <div class="box">
                <span class="label">相关链接</span>
            </div>
        </div>
    }
})

const TYPE_SELECT_ITEMS: SelectItem[] =
    Object.entries(TOPIC_TYPE_NAMES).map(([value, name]) => ({name, value}))

const TYPE_ICON_ELEMENTS: {[type in TopicType]: JSX.Element} =
    arrays.toMap(TOPIC_TYPE_ENUMS, type => <i class={`fa fa-${TOPIC_TYPE_ICONS[type]} mr-1`}/>)
