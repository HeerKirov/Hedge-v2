import { defineComponent, PropType, ref } from "vue"

export default defineComponent({
    setup() {
        const tags: (TagItem & RootTagDescription)[] = [
            {
                name: "元信息", color: "link", description: "元信息的描述",
                type: "addr",
                children: [
                    {
                        name: "图像类型",
                        type: "group",
                        children: [
                            {name: "插画", type: "tag"},
                            {name: "漫画", type: "tag"},
                            {name: "CG", type: "tag"},
                            {name: "游戏CG", type: "tag"},
                            {name: "动画片段", type: "tag"}
                        ]
                    },
                    {
                        name: "分级",
                        type: "group", sequencedGroup: true,
                        children: [
                            {name: "ALL", type: "tag"},
                            {name: "R15", type: "tag"},
                            {name: "R18", type: "tag"},
                            {name: "R18+", type: "tag"},
                            {name: "R18G", type: "tag"},
                        ]
                    },
                    {
                        name: "杂项", type: "tag"
                    },
                    {
                        name: "杂项2", type: "tag"
                    }
                ]
            },
            {
                name: "组A", color: "info", description: "这是group A",
                type: "addr",
                children: [
                    {name: "标签A", type: "tag"},
                    {name: "标签B", type: "tag"},
                    {name: "标签C", type: "tag"},
                ]
            },
            {
                name: "组B", color: "success", description: "这是group B",
                type: "addr",
                children: [
                    {
                        name: "标签A", type: "tag"
                    },
                    {
                        name: "标签B", type: "addr",
                        children: [
                            {
                                name: "子标签B.1", type: "addr",
                                children: [
                                    {name: "子标签B.1.1", type: "tag"},
                                    {name: "子标签B.1.2", type: "tag"}
                                ]
                            },
                            {name: "子标签B.2", type: "tag"},
                            {name: "子标签B.3", type: "tag"},
                            {name: "子标签B.4", type: "tag"}
                        ]
                    },
                    {
                        name: "标签C", type: "tag", 
                        children: [
                            {name: "子标签C.1", type: "tag"},
                            {name: "子标签C.2", type: "tag"}
                        ]
                    },
                ]
            },
            {
                name: "组C", color: "primary", description: "这是group C",
                type: "addr",
                children: [
                    {name: "标签A", type: "tag"},
                    {name: "标签B", type: "tag"},
                    {name: "标签C", type: "tag"},
                    {name: "标签D", type: "tag"},
                    {name: "标签E", type: "tag"}
                ]
            }
        ]

        return () => <div id="tag-tree">
            {tags.map(t => <RootNode value={t} color={t.color} description={t.description}/>)}
        </div>
    }
})

type TagType = "addr" | "tag" | "group"

interface TagItem {
    name: string
    type: TagType
    sequencedGroup?: boolean
    children?: TagItem[]
}

interface RootTagDescription {
    color: "primary" | "info" | "link" | "success" | "warning" | "danger"
    description?: string
}

//TODO 添加开关动画效果
//TODO 如何在项中简洁清晰地标示出组、序列化组、强制组
const RootNode = defineComponent({
    props: {
        value: {type: null as PropType<TagItem>, required: true},
        color: {type: String, required: true},
        description: String
    },
    setup(props) {
        const isExpanded = ref(true) // default false
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        return () => <div class="v-root-node box">
            <p>
                <a class={`has-text-${props.color}`}><b>{props.value.name}</b></a>
                <a onClick={switchExpanded} class={`tag ml-1 is-${props.color} is-light has-background-white v-function-button`}>
                    <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
                </a>
                <span class={`is-size-7 ml-2 has-text-${props.color}`}>{props.description}</span>
            </p>
            
            {isExpanded.value && <div>
                <ChildNodeList class="ml-2 mt-4" inline={false} value={props.value.children ?? []} color={props.color}/>
            </div>}
        </div>
    }
})

const ChildNodeList = defineComponent({
    props: {
        value: {type: null as PropType<TagItem[]>, required: true},
        inline: null as PropType<boolean | undefined>,
        color: String
    },
    setup(props) {
        return () => {
            const inline = props.inline ?? !props.value.find(t => t.children?.length)

            return <div class={`v-child-node-list ${inline && "field is-grouped is-grouped-multiline"}`}>
                {props.value.map(tag => <ChildNode value={tag} color={props.color} inline={inline}/>)}
            </div>
        }
    }
})

const ChildNode = defineComponent({
    props: {
        value: {type: null as PropType<TagItem>, required: true},
        color: {type: String, required: true},
        inline: {type: Boolean, required: true}
    },
    setup(props) {
        const isExpanded = ref(true) // default false
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        return () => {
            const hasChildren = props.value.children?.length ?? null
            const css = ["tag", "mb-0", props.color ? `is-${props.color}` : null]
            const tagElement = <div class="tags has-addons mb-0 mr-1">
                <a class={[...css, props.value.type !== "tag" ? "is-light" : null]}>{props.value.name}</a>
            </div>
            
            return props.inline ? tagElement : <div class="v-child-node">
                <div class="field is-grouped mb-1">
                    {tagElement}
                    {hasChildren && <a onClick={switchExpanded} class={[...css, "v-function-button", "is-light", "ml-1"]}>
                        <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
                    </a>}
                </div>
                {hasChildren && isExpanded.value && <ChildNodeList class="ml-6 mb-1" value={props.value.children} color={props.color}/>}
            </div>
        }
    }
})