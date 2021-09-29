import { computed, defineComponent, PropType } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { date, getDaysOfMonth, LocalDate } from "@/utils/datetime"
import { onKeyEnter } from "@/utils/events"

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

        const enterOnYear = (e: KeyboardEvent) => setYear(parseInt((e.target as HTMLInputElement).value))
        const enterOnMonth = (e: KeyboardEvent) => setMonth(parseInt((e.target as HTMLInputElement).value))
        const enterOnDay = (e: KeyboardEvent) => setDay(parseInt((e.target as HTMLInputElement).value))

        return () => <div>
            <NumberInput class="is-small is-width-half" placeholder="年" min={1970} value={props.value.year} onUpdateValue={setYear} onKeydown={onKeyEnter(enterOnYear)}/>
            -
            <NumberInput class="is-small" placeholder="月" min={1} max={12} value={props.value.month} onUpdateValue={setMonth} onKeydown={onKeyEnter(enterOnMonth)}/>
            -
            <NumberInput class="is-small" placeholder="日" min={1} max={maxDay.value} value={props.value.day} onUpdateValue={setDay} onKeydown={onKeyEnter(enterOnDay)}/>
        </div>
    }
})
