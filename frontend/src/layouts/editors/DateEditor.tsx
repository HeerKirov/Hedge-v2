import { computed, defineComponent, PropType } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { onKeyEnter, KeyEvent } from "@/services/global/keyboard"
import { date, getDaysOfMonth, LocalDate } from "@/utils/datetime"

export default defineComponent({
    props: {
        value: {type: Object as any as PropType<LocalDate>, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const maxDay = computed(() => props.value ? getDaysOfMonth(props.value.year, props.value.month) : undefined)

        const setYear = (year: number) => emit("updateValue", date.withYear(props.value, year))
        const setMonth = (month: number) => emit("updateValue", date.withMonth(props.value, month))
        const setDay = (day: number) => emit("updateValue", date.withDay(props.value, day))

        const enterOnYear = (e: KeyEvent) => setYear(parseInt((e.target as HTMLInputElement).value))
        const enterOnMonth = (e: KeyEvent) => setMonth(parseInt((e.target as HTMLInputElement).value))
        const enterOnDay = (e: KeyEvent) => setDay(parseInt((e.target as HTMLInputElement).value))

        return () => <div>
            <NumberInput class="is-small is-width-half" placeholder="年" min={1970} value={props.value.year} onUpdateValue={setYear} onKeypress={onKeyEnter(enterOnYear)}/>
            -
            <NumberInput class="is-small" placeholder="月" min={1} max={12} value={props.value.month} onUpdateValue={setMonth} onKeypress={onKeyEnter(enterOnMonth)}/>
            -
            <NumberInput class="is-small" placeholder="日" min={1} max={maxDay.value} value={props.value.day} onUpdateValue={setDay} onKeypress={onKeyEnter(enterOnDay)}/>
        </div>
    }
})
