import { computed, ComputedRef, defineComponent, Ref, ref, toRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { usePopupMenu } from "@/functions/module/popup-menu"
import { installation } from "@/functions/utils/basic"
import { useSideBarContext } from "./inject"

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
            <ScopeComponent id="db" name="图库">
                <StdItemComponent name="概览" icon="home" routeName="MainIndex"/>
                <StdItemComponent name="图库" icon="th" routeName="MainIllusts"/>
                <StdItemComponent name="画集" icon="clone" routeName="MainAlbums"/>
                <StdItemComponent name="分区" icon="calendar-alt" routeName="MainPartitions" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
            </ScopeComponent>
            <ScopeComponent id="meta" name="元数据">
                <StdItemComponent name="标签" icon="tag" routeName="MainTags"/>
                <StdItemComponent name="作者" icon="user-tag" routeName="MainAuthors" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
                <StdItemComponent name="主题" icon="hashtag" routeName="MainTopics" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
                <StdItemComponent name="注解" icon="code" routeName="MainAnnotations"/>
            </ScopeComponent>
            <ScopeComponent id="tool" name="工具箱">
                <StdItemComponent name="导入项目" icon="plus-square" routeName="MainImport"/>
                <StdItemComponent name="文件管理" icon="folder-open" routeName="MainFile"/>
                <StdItemComponent name="源数据" icon="spider" routeName="MainSourceImage"/>
            </ScopeComponent>
            <ScopeComponent id="folder" name="文件夹">
                <StdItemComponent name="所有文件夹" icon="archive" routeName="HedgeFolders"/>
                <SubItemFolders routeName="HedgeFoldersDetail"/>
            </ScopeComponent>
        </aside>
    }
})

/**
 * 最上层嵌套层级：提供一个可折叠的scope。子组件为第一级的menu item。
 */
const ScopeComponent = defineComponent({
    props: {
        id: {type: String, required: true},
        name: {type: String, required: true}
    },
    setup(props, { slots }) {
        const { scopeStatus } = useSideBarContext()
        const isOpen = computed<boolean>({
            get() { return scopeStatus[props.id] ?? true },
            set(value) { scopeStatus[props.id] = value }
        })
        const switchOpen = () => isOpen.value = !isOpen.value

        return () => <>
            <p class="menu-label"><a onClick={switchOpen}>{props.name}</a></p>
            {isOpen.value && <ul class="menu-list">
                {slots.default?.()}
            </ul>}
        </>
    }
})

/**
 * 标准的第一级menu item，能跳转到指定的导航，并根据导航确定当前项是否被选中。
 */
const StdItemComponent = defineComponent({
    props: {
        name: {type: String, required: true},
        icon: {type: String, required: true},
        routeName: {type: String, required: true},
        detailKey: String
    },
    setup(props, { slots }) {
        const { isActive, goto } = installStdItemContext(props.routeName, props.detailKey)

        return () => <li>
            <a class={{"is-active": isActive.value}} onClick={goto}><span class="icon"><i class={`fa fa-${props.icon}`}/></span><span>{props.name}</span></a>
            {slots.default?.()}
        </li>
    }
})

/**
 * 扩展标准第一级menu item的第二级menu item，根据导航和query参数处理detail项列表。
 */
const SubItemDetails = defineComponent({
    setup() {
        const { routeName, ifDetailActive, gotoDetail } = useStdItemContext()
        const { subItems, clearSubItem } = useSideBarContext()

        const items: ComputedRef<readonly {readonly key: string, readonly title: string}[]> = computed(() => subItems[routeName])

        const onClick = (key: string) => () => gotoDetail(key)

        const { popup } = usePopupMenu([{type: "normal", label: "清空历史记录", click: () => clearSubItem(routeName)}])

        return () => ((items.value && items.value.length) || null) && <ul>
            {items.value.map(item => <li key={item.key}>
                <a class={{"is-active": ifDetailActive(item.key)}} onClick={onClick(item.key)} onContextmenu={() => popup()}>{item.title ?? item.key}</a>
            </li>)}
        </ul>
    }
})

const [installStdItemContext, useStdItemContext] = installation(function(routeName: string, detailKey: string | undefined) {
    const route = useRoute()
    const router = useRouter()

    const isCurrentRouteName = computed(() => route.name === routeName)

    const currentItemKey: Ref<string | null> = detailKey ? computed(() => isCurrentRouteName.value ? route.query[detailKey] as string | null : null) : ref(null)

    const isActive = computed(() => isCurrentRouteName.value && currentItemKey.value == null)

    const ifDetailActive = (key: string) => isCurrentRouteName.value && currentItemKey.value === key

    const goto = () => router.push({name: routeName}).finally()

    const gotoDetail = detailKey ? (key: string) => router.push({name: routeName, query: {[detailKey]: key}}).finally() : (_: string) => {}

    return {routeName, isActive, ifDetailActive, goto, gotoDetail}
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
