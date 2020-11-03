import { defineComponent, PropType, ref, Transition } from "vue"

export default defineComponent({
    props: {

    },
    setup(props) {
        const tags: (TagItem & RootTagDescription)[] = [
            {
                name: "元信息", color: "purple", description: "元信息的描述",
                isAddr: true,
                children: [
                    {
                        name: "图像类型",
                        isAddr: true, isGroup: {forced: true},
                        children: [
                            {name: "插画"},
                            {name: "漫画"},
                            {name: "CG"},
                            {name: "游戏CG"},
                            {name: "动画片段"}
                        ]
                    },
                    {
                        name: "分级",
                        isAddr: true, isGroup: {sequenced: true},
                        children: [
                            {name: "ALL"},
                            {name: "R15"},
                            {name: "R18"},
                            {name: "R18+"},
                            {name: "R18G"},
                        ]
                    },
                    {name: "杂项"},
                    {name: "杂项2"}
                ]
            },
            {
                name: "组A", color: "info", description: "这是group A",
                isAddr: true,
                children: [
                    {name: "标签A"},
                    {name: "标签B"},
                    {name: "标签C"},
                ]
            },
            {
                name: "组B", color: "brown", description: "这是group B",
                isAddr: true,
                children: [
                    {
                        name: "标签A"
                    },
                    {
                        name: "标签B", isAddr: true,
                        children: [
                            {
                                name: "子标签B.1", isAddr: true,
                                children: [
                                    {name: "子标签B.1.1"},
                                    {name: "子标签B.1.2"}
                                ]
                            },
                            {name: "子标签B.2"},
                            {name: "子标签B.3"},
                            {name: "子标签B.4"}
                        ]
                    },
                    {
                        name: "标签C",
                        children: [
                            {name: "子标签C.1"},
                            {name: "子标签C.2"}
                        ]
                    },
                ]
            },
            {
                name: "组C", color: "primary", description: "这是group C",
                isAddr: true,
                children: [
                    {name: "标签A"},
                    {name: "标签B"},
                    {name: "标签C"},
                    {name: "标签D"},
                    {name: "标签E"}
                ]
            },
            {
                name: "组D", color: "warning", description: "这是group D",
                isAddr: true
            },
            {
                name: "组E", color: "danger", description: "这是group E",
                isAddr: true
            },
        ]

        return () => <div id="tag-tree">
            {tags.map(t => <RootNode value={t} color={t.color} description={t.description}/>)}
        </div>
    }
})

interface TagItem {
    name: string
    isAddr?: boolean
    isGroup?: boolean | {sequenced?: boolean, forced?: boolean}
    children?: TagItem[]
}

interface RootTagDescription {
    color: "primary" | "info" | "link" | "success" | "warning" | "danger" | "purple" | "pink" | "brown"
    description?: string
}

const RootNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagItem>, required: true},
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
                {isExpanded.value && <span class={`is-size-7 ml-2 has-text-${props.color}`}>{props.description}</span>}
            </p>
            
            <Transition name="v-expand-transition">
                {isExpanded.value && <div class="v-expanded-box">
                    <ChildNodeList class="ml-2 mt-4" inline={false} value={props.value.children ?? []} color={props.color}/>
                </div>}
            </Transition>
        </div>
    }
})

const ChildNodeList = defineComponent({
    props: {
        value: {type: null as any as PropType<TagItem[]>, required: true},
        inline: null as any as PropType<boolean | undefined>,
        color: String
    },
    setup(props) {
        return () => {
            const inline = props.inline ?? !props.value.find(t => t.children?.length)

            return <div class={`v-child-node-list ${inline && "field is-grouped is-grouped-multiline"}`}>
                {props.value.map(tag => <ChildNode value={tag} color={props.color!} inline={inline}/>)}
            </div>
        }
    }
})

const ChildNode = defineComponent({
    props: {
        value: {type: null as any as PropType<TagItem>, required: true},
        color: {type: String, required: true},
        inline: {type: Boolean, required: true}
    },
    setup(props) {
        const isExpanded = ref(true) // default false
        const switchExpanded = () => { isExpanded.value = !isExpanded.value }

        return () => {
            const hasChildren = props.value.children?.length ?? null
            const css = ["tag", "mb-0", props.color ? `is-${props.color}` : null]
            
            return props.inline ? <TagElement value={props.value} color={props.color}/> : <div class="v-child-node">
                <div class="field is-grouped mb-1">
                    <TagElement value={props.value} color={props.color}/>
                    {hasChildren && <a onClick={switchExpanded} class={[...css, "v-function-button", "is-light", "ml-1"]}>
                        <i class={`fa fa-angle-${isExpanded.value ? "down" : "right"}`}/>
                    </a>}
                </div>
                {hasChildren && isExpanded.value && <ChildNodeList class="ml-6 mb-1" value={props.value.children!} color={props.color}/>}
            </div>
        }
    }
})

const TagElement = defineComponent({
    props: {
        value: {type: null as any as PropType<TagItem>, required: true},
        color: {type: String, required: true}
    },
    setup(props) {
        return () => {
            const css = ["tag", "mb-0", props.color ? `is-${props.color}` : null]

            return <div class="tags has-addons mb-0 mr-1">
                <a class={[...css, props.value.isAddr ? "is-light" : null]}>
                    {typeof props.value.isGroup === "object" && props.value.isGroup.sequenced && <i class="fa fa-sort-alpha-down mr-1"/>}
                    {typeof props.value.isGroup === "object" && props.value.isGroup.forced && <b class="mr-1">!</b>}
                    {props.value.isGroup && <b class="mr-1">{'{'}</b>}
                    {props.value.name}
                    {props.value.isGroup && <b class="ml-1">{'}'}</b>}
                </a>
            </div>
        }
    }
})