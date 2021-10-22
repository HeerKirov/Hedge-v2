import { defineComponent, reactive, ref, watch } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { interceptGlobalKey } from "@/functions/feature/keyboard"
import { usePartitionContext } from "./inject"
import style from "./style.module.scss"

/**
 * 业务内容为image时，通用的顶栏业务内容。可内嵌在顶栏组件内使用。
 */
export default defineComponent({
    setup() {
        const { viewMode } = usePartitionContext()

        return () => <div class={[style.topBar, "middle-layout"]}>
            <div class="layout-container">
                <span class="ml-3 is-size-large">{viewMode.value === "calendar" ? "日历" : "时间线"}</span>
            </div>
            {viewMode.value === "calendar" && <div class="layout-container">
                <CalendarDate/>
            </div>}
            <div class="layout-container">
                <button class={`button square no-drag radius-large no-radius-right ${viewMode.value === "timeline" ? "is-link" : ""}`} onClick={() => viewMode.value = "timeline"}>
                    <i class="fa fa-sort-amount-down"/>
                </button>
                <button class={`button square no-drag radius-large no-radius-left ${viewMode.value === "calendar" ? "is-link" : ""}`} onClick={() => viewMode.value = "calendar"}>
                    <i class="fa fa-calendar"/>
                </button>
            </div>
        </div>
    }
})

const CalendarDate = defineComponent({
    setup() {
        const { calendarDate } = usePartitionContext()

        const editMode = ref(false)
        const editValue = reactive({year: 0, month: 0})
        const edit = () => {
            editValue.year = calendarDate.value.year
            editValue.month = calendarDate.value.month
            editMode.value = true
        }
        const save = () => {
            calendarDate.value = {...editValue}
            editMode.value = false
        }

        const prev = () => {
            if(calendarDate.value.month <= 1) {
                calendarDate.value = {year: calendarDate.value.year - 1, month: 12}
            }else{
                calendarDate.value = {year: calendarDate.value.year, month: calendarDate.value.month - 1}
            }
        }
        const next = () => {
            if(calendarDate.value.month >= 12) {
                calendarDate.value = {year: calendarDate.value.year + 1, month: 1}
            }else{
                calendarDate.value = {year: calendarDate.value.year, month: calendarDate.value.month + 1}
            }
        }

        watch(calendarDate, date => {
            if(editMode.value) {
                editValue.year = date.year
                editValue.month = date.month
            }
        })

        interceptGlobalKey(["ArrowUp", "ArrowLeft"], prev)
        interceptGlobalKey(["ArrowDown", "ArrowRight"], next)


        return () => <div class={style.calendarDate}>
            {editMode.value ? <>
                <NumberInput class={style.yearEditor} min={1995} max={2077} value={editValue.year} onUpdateValue={v => editValue.year = v}/>年
                <NumberInput class={style.monthEditor} min={1} max={12} value={editValue.month} onUpdateValue={v => editValue.month = v}/>月
                <button class="button square is-white ml-1" onClick={save}><span class="icon"><i class="fa fa-check"/></span></button>
            </> : <>
                <button class="button square is-white" onClick={prev}><span class="icon"><i class="fa fa-angle-left"/></span></button>
                <button class={[style.textButton, "button", "is-white"]} onClick={edit}>
                    <b>{calendarDate.value.year}</b>年<b>{calendarDate.value.month}</b>月
                </button>
                <button class="button square is-white" onClick={next}><span class="icon"><i class="fa fa-angle-right"/></span></button>
            </>}
        </div>
    }
})
