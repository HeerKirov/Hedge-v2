import { computed, defineComponent, PropType } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { onKeyEnter, KeyEvent } from "@/functions/feature/keyboard"
import { LocalDateTime, datetime, getDaysOfMonth } from "@/utils/datetime"

export default defineComponent({
    props: {
        value: {type: Object as any as PropType<LocalDateTime>, required: true}
    },
    emits: ["updateValue"],
    setup(props, { emit }) {
        const maxDay = computed(() => props.value ? getDaysOfMonth(props.value.year, props.value.month) : undefined)

        const setYear = (year: number) => emit("updateValue", datetime.withYear(props.value, year))
        const setMonth = (month: number) => emit("updateValue", datetime.withMonth(props.value, month))
        const setDay = (day: number) => emit("updateValue", datetime.withDay(props.value, day))
        const setHour = (hour: number) => emit("updateValue", datetime.withHour(props.value, hour))
        const setMinute = (minute: number) => emit("updateValue", datetime.withMinute(props.value, minute))
        const setSecond = (second: number) => emit("updateValue", datetime.withSecond(props.value, second))

        const enterOnYear = (e: KeyEvent) => setYear(parseInt((e.target as HTMLInputElement).value))
        const enterOnMonth = (e: KeyEvent) => setMonth(parseInt((e.target as HTMLInputElement).value))
        const enterOnDay = (e: KeyEvent) => setDay(parseInt((e.target as HTMLInputElement).value))
        const enterOnHour = (e: KeyEvent) => setHour(parseInt((e.target as HTMLInputElement).value))
        const enterOnMinute = (e: KeyEvent) => setMinute(parseInt((e.target as HTMLInputElement).value))
        const enterOnSecond = (e: KeyEvent) => setSecond(parseInt((e.target as HTMLInputElement).value))

        return () => <div>
            <div class="mb-1">
                <NumberInput class="is-small is-width-half" placeholder="年" min={1970} value={props.value.year} onUpdateValue={setYear} onKeypress={onKeyEnter(enterOnYear)}/>
                -
                <NumberInput class="is-small" placeholder="月" min={1} max={12} value={props.value.month} onUpdateValue={setMonth} onKeypress={onKeyEnter(enterOnMonth)}/>
                -
                <NumberInput class="is-small" placeholder="日" min={1} max={maxDay.value} value={props.value.day} onUpdateValue={setDay} onKeypress={onKeyEnter(enterOnDay)}/>
            </div>
            <div>
                <NumberInput class="is-small is-width-one-third" min={0} max={23} placeholder="时" value={props.value.hours} onUpdateValue={setHour} onKeypress={onKeyEnter(enterOnHour)}/>
                &nbsp;:&nbsp;
                <NumberInput class="is-small is-width-one-third" min={0} max={59} placeholder="分" value={props.value.minutes} onUpdateValue={setMinute} onKeypress={onKeyEnter(enterOnMinute)}/>
                &nbsp;:&nbsp;
                <NumberInput class="is-small is-width-one-third" min={0} max={59} placeholder="秒" value={props.value.seconds} onUpdateValue={setSecond} onKeypress={onKeyEnter(enterOnSecond)}/>
            </div>
        </div>
    }
})
