import { computed, ComputedRef, defineComponent, onMounted, PropType, Ref, ref } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useAddToFolderService } from "@/layouts/globals/GlobalDialog/AddToFolder"
import { usePopupMenu } from "@/services/module/popup-menu"
import { installation } from "@/functions/utils/basic"
import { useHttpClient } from "@/services/app"
import { useToast } from "@/services/module/toast"
import { useDroppable } from "@/services/global/drag"
import { useSideBarContext } from "./inject"

/**
 * 主要界面的侧边菜单栏。内嵌在通用布局内使用。
 */
export default defineComponent({
    setup() {
        /*subitem给二级项目使用。包括画集、日历、标签、主题、所有目录。
            在点进一个详情项目时，在subitem追加一条，并高亮显示。
            每个种类的subitem数量有上限，多了之后挤走旧的。
        */
        return () => <aside class="menu">
            <ScopeComponent id="db" name="图库">
                <StdItemComponent name="概览" icon="home" routeName="MainIndex"/>
                <StdItemComponent name="图库" icon="th" routeName="MainIllusts"/>
                <StdItemComponent name="分区" icon="calendar-alt" routeName="MainPartitions" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
                <StdItemComponent name="画集" icon="clone" routeName="MainAlbums"/>
            </ScopeComponent>
            <ScopeComponent id="meta" name="元数据">
                <StdItemComponent name="作者" icon="user-tag" routeName="MainAuthors" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
                <StdItemComponent name="主题" icon="hashtag" routeName="MainTopics" detailKey="detail">
                    <SubItemDetails/>
                </StdItemComponent>
                <StdItemComponent name="标签" icon="tag" routeName="MainTags"/>
                <StdItemComponent name="注解" icon="code" routeName="MainAnnotations"/>
            </ScopeComponent>
            <ScopeComponent id="tool" name="工具箱">
                <StdItemComponent name="导入" icon="plus-square" routeName="MainImport"/>
                <StdItemComponent name="来源数据" icon="spider" routeName="MainSourceImage"/>
                <StdItemComponent name="相似项查找" icon="grin-squint" routeName="MainFindSimilar"/>
            </ScopeComponent>
            <ScopeComponent id="folder" name="目录">
                <StdItemFolders routeName="MainFolders" detailKey="detail"/>
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

const StdItemFolders = defineComponent({
    props: {
        routeName: {type: String, required: true},
        detailKey: {type: String, default: "detail"},
        tmpDetailKey: {type: String, default: "tmp"}
    },
    setup(props) {
        const route = useRoute()
        const router = useRouter()
        const isCurrentRouteName = computed(() => route.name === props.routeName)
        const currentItemKey: Ref<string | null> = computed(() => isCurrentRouteName.value ? route.query[props.detailKey] as string | null : null)
        const isActive = computed(() => isCurrentRouteName.value && currentItemKey.value == null)
        const ifDetailActive = (key: string) => isCurrentRouteName.value && currentItemKey.value === key

        const { subItems, clearSubItem } = useSideBarContext()
        const items: ComputedRef<readonly {readonly key: string, readonly title: string}[]> = computed(() => subItems[props.routeName] ?? [])

        const { pinnedItems } = usePinnedFolders(props.routeName)
        const pins: ComputedRef<readonly {readonly key: string, readonly title: string}[]> = computed(() => pinnedItems[props.routeName] ?? [])

        const { onDrop } = useDropIllusts()

        const onClick = (key: string | undefined) => () => router.push({name: props.routeName, query: {[props.detailKey]: key}})

        const menu = usePopupMenu([{type: "normal", label: "清空历史记录", click: () => clearSubItem(props.routeName)}])

        return () => <>
            <li>
                <a class={{"is-active": isActive.value}} onClick={onClick(undefined)}>
                    <span class="icon"><i class="fa fa-archive"/></span><span>所有目录</span>
                </a>
            </li>
            {pins.value.map(item => <StdItemFolderItem key={item.key} item={item} isActive={ifDetailActive(item.key)} pinned={true}
                                                       onClick={onClick(item.key)} onContextmenu={() => menu.popup()} onDropToHere={onDrop(item.key)}/>)}
            {items.value.map(item => <StdItemFolderItem key={item.key} item={item} isActive={ifDetailActive(item.key)}
                                                        onClick={onClick(item.key)} onContextmenu={() => menu.popup()} onDropToHere={onDrop(item.key)}/>)}
        </>
    }
})

const StdItemFolderItem = defineComponent({
    props: {
        item: {type: Object as PropType<{readonly key: string, readonly title: string}>, required: true},
        pinned: Boolean,
        isActive: Boolean
    },
    emits: {
        click: () => true,
        contextmenu: () => true,
        dropToHere: (_: number[]) => true
    },
    setup(props, { emit }) {
        const { isDragover: _, ...dropEvents } = useDroppable("illusts", illusts => emit("dropToHere", illusts.map(i => i.id)))

        return () => <li class="relative" {...dropEvents}>
            <a class={{"is-active": props.isActive}} onClick={() => emit("click")} onContextmenu={() => emit("contextmenu")}>
                <span class="icon"><i class="fa fa-folder"/></span><span>{props.item.title}</span>
                {props.pinned && <i class="fa fa-thumbtack absolute right mr-2 mt-half"/>}
            </a>
        </li>
    }
})

function usePinnedFolders(routeName: string) {
    const toast = useToast()
    const httpClient = useHttpClient()
    const { setPinnedItems, pinnedItems } = useSideBarContext()

    onMounted(async () => {
        const res = await httpClient.folder.pin.list()
        if(res.ok) {
            const items = res.data.map(item => ({key: item.id.toString(), title: item.address.join("/")}))
            setPinnedItems(routeName, items)
        }else{
            toast.handleException(res.exception)
            setPinnedItems(routeName, [])
        }
    })

    return {pinnedItems}
}

function useDropIllusts() {
    const toast = useToast()
    const httpClient = useHttpClient()
    const addToFolder = useAddToFolderService()

    const onDrop = (key: string) => async (imageIds: number[]) => {
        const folderId = parseInt(key)
        const images = await addToFolder.existsCheck(imageIds, folderId)
        if(images !== undefined && images.length > 0) {
            const res = await httpClient.folder.images.partialUpdate(folderId, {action: "ADD", images})
            if(res.ok) {
                toast.toast("已添加", "success", "新的项已添加到目录。")
            }else{
                toast.handleException(res.exception)
            }
        }
    }

    return {onDrop}
}
