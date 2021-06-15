import { computed, defineComponent, PropType } from "vue"
import NumberInput from "@/components/forms/NumberInput"
import { LocalDateTime, datetime, getDaysOfMonth } from "@/utils/datetime"
import { onKeyEnter } from "@/utils/events"

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

        const enterOnYear = (e: KeyboardEvent) => setYear(parseInt((e.target as HTMLInputElement).value))
        const enterOnMonth = (e: KeyboardEvent) => setMonth(parseInt((e.target as HTMLInputElement).value))
        const enterOnDay = (e: KeyboardEvent) => setDay(parseInt((e.target as HTMLInputElement).value))
        const enterOnHour = (e: KeyboardEvent) => setHour(parseInt((e.target as HTMLInputElement).value))
        const enterOnMinute = (e: KeyboardEvent) => setMinute(parseInt((e.target as HTMLInputElement).value))
        const enterOnSecond = (e: KeyboardEvent) => setSecond(parseInt((e.target as HTMLInputElement).value))

        return () => <div>
            <div class="mb-1">
                <NumberInput class="is-small is-width-half" placeholder="年" min={1970} value={props.value.year} onUpdateValue={setYear} onKeydown={onKeyEnter(enterOnYear)}/>
                -
                <NumberInput class="is-small" placeholder="月" min={1} max={12} value={props.value.month} onUpdateValue={setMonth} onKeydown={onKeyEnter(enterOnMonth)}/>
                -
                <NumberInput class="is-small" placeholder="日" min={1} max={maxDay.value} value={props.value.day} onUpdateValue={setDay} onKeydown={onKeyEnter(enterOnDay)}/>
            </div>
            <div>
                <NumberInput class="is-small is-width-one-third" min={0} max={23} placeholder="时" value={props.value.hours} onUpdateValue={setHour} onKeydown={onKeyEnter(enterOnHour)}/>
                &nbsp;:&nbsp;
                <NumberInput class="is-small is-width-one-third" min={0} max={59} placeholder="分" value={props.value.minutes} onUpdateValue={setMinute} onKeydown={onKeyEnter(enterOnMinute)}/>
                &nbsp;:&nbsp;
                <NumberInput class="is-small is-width-one-third" min={0} max={59} placeholder="秒" value={props.value.seconds} onUpdateValue={setSecond} onKeydown={onKeyEnter(enterOnSecond)}/>
            </div>
        </div>
    }
})
