import { computed, defineComponent, PropType, reactive, Ref, ref, watch } from "vue"
import NumberInput from "../../../../components/NumberInput"
import { arrays } from "../../../../utils/collections"
import { getDaysOfMonth } from "../../../../utils/datetime"

type YearAndMonth = {year: number, month: number}

/**
 * 日历形态的面板。
 */
export default defineComponent({
    setup() {
        const date = ref<YearAndMonth>({year: 2020, month: 10})

        return () => <div id="panel-calendar">
            <div class="h-title-bar"/>
            <NavBar value={date.value} onUpdateValue={(v: YearAndMonth) => date.value = v}/>
            <Grid date={date.value}/>
        </div>
    }
})

/**
 * 日历的导航栏。
 */
const NavBar = defineComponent({
    props: {
        value: null as PropType<YearAndMonth>
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const editMode = ref(false)
        const editValue = reactive({year: 0, month: 0})
        const edit = () => { 
            editValue.year = showValue.value.year
            editValue.month = showValue.value.month
            editMode.value = true 
        }
        const save = () => {
            showValue.value = {...editValue}
            editMode.value = false
        }

        const now = new Date()
        const showValue = ref({year: props.value?.year ?? now.getFullYear(), month: props.value?.month ?? (now.getMonth() + 1)})
        const prev = () => {
            if(showValue.value.month <= 1) {
                showValue.value = {year: showValue.value.year - 1, month: 12}
            }else{
                showValue.value = {year: showValue.value.year, month: showValue.value.month - 1}
            }
        }
        const next = () => {
            if(showValue.value.month >= 12) {
                showValue.value = {year: showValue.value.year + 1, month: 1}
            }else{
                showValue.value = {year: showValue.value.year, month: showValue.value.month + 1}
            }
        }

        watch(() => props.value, () => {
            showValue.value = {
                year: props.value?.year ?? now.getFullYear(), 
                month: props.value?.month ?? (now.getMonth() + 1)
            }
            if(editMode.value) {
                editValue.year = showValue.value.year
                editValue.month = showValue.value.month
            }
        })

        watch(showValue, () => emit("updateValue", showValue.value))

        return () => <nav class="level v-nav-bar">
            <div class="level-item">
                {editMode.value ? <>
                    <NumberInput class="v-year-editor mr-1" min={1995} max={2077} value={editValue.year} onUpdateValue={(v: number) => editValue.year = v}/>年
                    <NumberInput class="v-month-editor mx-1" max={12} min={1} value={editValue.month} onUpdateValue={(v: number) => editValue.month = v}/>月
                    <button class="button ml-1" onClick={save}><span class="icon"><i class="fa fa-check"/></span></button>
                </> : <>
                    <button class="button is-white" onClick={prev}><span class="icon"><i class="fa fa-angle-left"/></span></button>
                    <a class="has-text-dark mx-4" onClick={edit}><b>{showValue.value.year}</b>年<b>{showValue.value.month}</b>月</a>
                    <button class="button is-white" onClick={next}><span class="icon"><i class="fa fa-angle-right"/></span></button>
                </>}
            </div>
        </nav>
    }
})

/**
 * 日历的网格区域，也就是主要内容区域。
 */
const Grid = defineComponent({
    props: {
        date: {type: null as PropType<YearAndMonth>, required: true}
    },
    setup(props) {
        const weekdayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

        const days: Ref<(number | null)[]> = computed(() => {
            const date = new Date(props.date.year, props.date.month - 1, 1)
            const spaceList = Array<number | null>([6, 0, 1, 2, 3, 4, 5][date.getDay()]).fill(null)
            const valueList = arrays.newArray(getDaysOfMonth(props.date.year, props.date.month), i => i + 1)
            return spaceList.concat(valueList)
        })

        const items: Ref<({day: number, exist: boolean} | null)[]> = computed(() => {
            //实际计算时，每次变化会异步查询一次当前月份的partitions项，获取找出存在数据的partitions。
            return days.value.map(day => day && {day, exist: !!(day % 3)})
        })

        return () => <div class="v-grid">
            <div class="notification v-header">
                {weekdayNames.map(i => <div><b>{i}</b></div>)}
            </div>
            <div class="v-content">
                {items.value.map(item => <div>
                    {item && <div class={`notification ${item.exist ? "is-link hoverable" : ""}`}>{item.day}</div>}
                </div>)}
            </div>
        </div>
    }
})