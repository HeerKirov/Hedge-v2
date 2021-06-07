import { computed, defineComponent, PropType } from "vue"
import { VirtualRow } from "@/components/features/VirtualScrollView"
import { useFastObjectEndpoint } from "@/functions/utils/endpoints/object-fast-endpoint"
import { useMessageBox, usePopupMenu } from "@/functions/module"
import { datetime, LocalDateTime } from "@/utils/datetime"
import { useImportContext } from "./inject"
import style from "./style.module.scss"

export default defineComponent({
    setup() {
        const messageBox = useMessageBox()
        const { list, pane } = useImportContext()

        const fastEndpoint = useFastObjectEndpoint({
            delete: httpClient => httpClient.import.delete
        })

        const deleteItem = async (id: number) => {
            if(await messageBox.showYesNoMessage("warn", "确定要删除此项吗？", "此操作不可撤回。")) {
                if(await fastEndpoint.deleteData(id)) {
                    if(pane.detailMode.value === id) pane.closePane()
                    const index = list.endpoint.operations.find(i => i.id === id)
                    if(index != undefined) list.endpoint.operations.remove(index)
                }
            }
        }

        const popupmenu = usePopupMenu<number>([
            {type: "normal", label: "查看详情", click: pane.openDetailPane},
            {type: "separator"},
            {type: "normal", label: "删除此项目", click: deleteItem},
        ])

        return () => <div class={style.listView}>
            <VirtualRow rowHeight={35} padding={5} bufferSize={10} onUpdate={list.endpoint.dataUpdate} {...list.endpoint.data.value.metrics}>
                {list.endpoint.data.value.result.map(item => <Item key={item.id} {...item} onRightClick={popupmenu.popup}/>)}
            </VirtualRow>
        </div>
    }
})

const Item = defineComponent({
    props: {
        id: {type: Number, required: true},
        fileName: {type: null as any as PropType<string | null>, required: true},
        fileImportTime: {type: Object as PropType<LocalDateTime | null>, required: true}
    },
    emits: ["rightClick"],
    setup(props, { emit }) {
        const { pane: { detailMode, openDetailPane } } = useImportContext()

        const selected = computed(() => detailMode.value === props.id)

        const click = () => openDetailPane(props.id)
        const rightClick = () => emit("rightClick", props.id)

        return () => <div class={{[style.listItem]: true, "has-bg-link": selected.value, "has-text-white": selected.value}} onClick={click} onContextmenu={rightClick}>
            <span class={style.filename}>{props.fileName}</span>
            <span class={{[style.time]: true, "has-text-grey": !selected.value}}>{props.fileImportTime ? datetime.toSimpleFormat(props.fileImportTime) : ""}</span>
        </div>
    }
})
