import { computed, ComputedRef, defineComponent, inject, PropType, reactive, Ref, ref, toRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { SideBarContextInjection } from "./inject"
import style from "./style.module.scss"

/**
 * 主要界面的侧边菜单栏。内嵌在通用布局内使用。
 */
export default defineComponent({
    setup() {
        /*subitem给二级项目使用。包括画集、日历、标签、主题、所有文件夹。
            在点进一个详情项目时，在subitem追加一条，并高亮显示。
            每个种类的subitem数量有上限，多了之后挤走旧的。
            日历默认就显示最近的几个时间项。
        */
        return () => <aside class="menu">
            <ScopeComponent name="图库">
                <StdItemComponent name="图库" icon="th" routeName="MainIndex"/>
                <StdItemComponent name="搜索" icon="search" routeName="MainImage"/>
                <StdItemComponent name="画集" icon="clone" routeName="MainAlbums"/>
                <StdItemComponent name="分区" icon="calendar-alt" routeName="MainPartitions">
                    <SubItemGroups routeName="MainPartitionsDetail" paramKey="partition"/>
                </StdItemComponent>
            </ScopeComponent>
            <ScopeComponent name="元数据">
                <StdItemComponent name="标签" icon="tag" routeName="MainTags"/>
                <StdItemComponent name="作者" icon="user-tag" routeName="MainAuthors">
                    <SubItemGroups routeName="MainAuthorsDetail" paramKey="id"/>
                </StdItemComponent>
                <StdItemComponent name="主题" icon="hashtag" routeName="MainTopics">
                    <SubItemGroups routeName="MainTopicsDetail" paramKey="id"/>
                </StdItemComponent>
                <StdItemComponent name="注解" icon="code" routeName="MainAnnotations"/>
            </ScopeComponent>
            <ScopeComponent name="工具箱">
                <StdItemComponent name="导入项目" icon="plus-square" routeName="HedgeImport"/>
                <StdItemComponent name="文件管理" icon="folder-open" routeName="HedgeFile"/>
                <StdItemComponent name="爬虫" icon="spider" routeName="HedgeSpider"/>
            </ScopeComponent>
            <ScopeComponent name="文件夹">
                <StdItemComponent name="所有文件夹" icon="archive" routeName="HedgeFolders"/>
                <SubItemFolders routeName="HedgeFoldersDetail"/>
            </ScopeComponent>
        </aside>
    }
})

const ScopeComponent = defineComponent({
    props: {
        name: {type: String, required: true}
    },
    setup(props, { slots }) {
        const isOpen = ref(true)
        const switchOpen = () => { isOpen.value = !isOpen.value }

        return () => <>
            <p class="menu-label"><a onClick={switchOpen}>{props.name}</a></p>
            {isOpen.value && <ul class="menu-list">
                {slots.default?.()}
            </ul>}
        </>
    }
})

const StdItemComponent = defineComponent({
    props: {
        name: {type: String, required: true},
        icon: {type: String, required: true},
        routeName: String
    },
    setup(props, { slots }) {
        const route = useRoute()
        const router = useRouter()
        const routeName = toRef(route, 'name')
        const click = () => {
            router.push({name: props.routeName})
        }

        return () => <li>
            <a class={{"is-active": routeName.value === props.routeName}} onClick={click}><span class="icon"><i class={`fa fa-${props.icon}`}/></span><span>{props.name}</span></a>
            {slots.default?.()}
        </li>
    }
})

const SubItemGroups = defineComponent({
    props: {
        routeName: {type: String, required: true},
        paramKey: {type: String, default: "id"},
        maxCount: {type: Number, default: 5}
    },
    setup(props) {
        const route = useRoute()
        const router = useRouter()
        const routeName = toRef(route, 'name')
        const routeParams = toRef(route, 'params')

        const sideBarContext = inject(SideBarContextInjection)!

        const items: ComputedRef<readonly {readonly key: string, readonly title: string}[]> = computed(() => sideBarContext.subItems[props.routeName])
        const currentItemKey = ref<string>()

        watch(routeName, () => {
            currentItemKey.value = routeName.value === props.routeName ? route.params[props.paramKey] as string : undefined
        }, {immediate: true})

        watch(routeParams, params => {
            if(routeName.value === props.routeName) {
                currentItemKey.value = params[props.paramKey] as string
            }
        })

        const onClick = (key: string) => () => {
            router.push({name: props.routeName, params: {[props.paramKey]: key}})
        }

        return () => items.value && <ul>
            {items.value.map(item => <li key={item.key}>
                <a class={{"is-active": item.key === currentItemKey.value}} onClick={onClick(item.key)}>{item.title ?? item.key}</a>
            </li>)}
        </ul>
    }
})

const SubItemFolders = defineComponent({
    props: {
        routeName: {type: String, required: true},
        paramKey: {type: String, default: "id"},
        tmpKeyValue: {type: String, default: "tmp"}
    },
    setup(props) {
        const route = useRoute()
        const router = useRouter()
        const routeName = toRef(route, 'name')
        const routeParams = toRef(route, 'params')

        const currentItemKey = ref<string>()
        const items: Ref<{key: string, title: string, virtual?: boolean}[]> = ref([
            //mock data，实际数据从server拉取folder列表
            {key: "1", title: "文件夹A"},
            {key: "2", title: "文件夹B", virtual: true}
        ])

        watch(routeName, () => {
            currentItemKey.value = routeName.value === props.routeName ? route.params[props.paramKey] as string : undefined
        }, {immediate: true})

        watch(routeParams, params => {
            if(routeName.value === props.routeName) {
                currentItemKey.value = params[props.paramKey] as string
            }
        })

        const onClick = (key: string) => () => router.push({name: props.routeName, params: {[props.paramKey]: key}})

        return () => <>
            <li>
                <a class={{"is-active": props.tmpKeyValue === currentItemKey.value}} onClick={onClick(props.tmpKeyValue)}>
                    <span class="icon"><i class="fa fa-shopping-basket"/></span><span>临时文件夹</span>
                </a>
            </li>
            {items.value.map(item => <li key={item.key}>
                <a class={{"is-active": item.key === currentItemKey.value}} onClick={onClick(item.key)}>
                    <span class="icon"><i class={`fa fa-${item.virtual ? "folder-minus" : "folder"}`}/></span><span>{item.title}</span>
                </a>
            </li>)}
        </>
    }
})