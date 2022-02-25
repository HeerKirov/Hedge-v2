import { computed, defineComponent, Ref, ref, watch } from "vue"
import { useObjectEndpoint } from "@/functions/endpoints/object-endpoint"
import { arrays } from "@/utils/collections"
import { date, getDaysOfMonth } from "@/utils/datetime"
import { usePartitionContext } from "./inject"
import style from "./style.module.scss"

/**
 * 日历形态的面板。
 */
export default defineComponent({
    setup() {
        const { calendarDate, today, detail } = usePartitionContext()
        const weekdayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
        const spaceCount = [6, 0, 1, 2, 3, 4, 5]

        const days: Ref<(number | null)[]> = computed(() => {
            const date = new Date(calendarDate.value.year, calendarDate.value.month - 1, 1)
            const spaceList = Array<number | null>(spaceCount[date.getDay()]).fill(null)
            const valueList = arrays.newArray(getDaysOfMonth(calendarDate.value.year, calendarDate.value.month), i => i + 1)
            return [...spaceList, ...valueList]
        })

        const { data } = useObjectEndpoint({
            path: calendarDate,
            get: httpClient => d => {
                const gte = date.ofDate(d.year, d.month, 1)
                const lt = d.month === 12 ? date.ofDate(d.year + 1, 1, 1) : date.ofDate(d.year, d.month + 1, 1)
                return httpClient.partition.list({gte, lt})
            }
        })

        const items: Ref<({day: number, count: number | null, today: boolean} | null)[]> = ref([])

        watch(data, partitions => {
            const thisMonth = today.year === calendarDate.value.year && today.month === calendarDate.value.month
            if(partitions !== null) {
                const daysCount: Record<number, number> = {}
                for (const { date, count } of partitions) {
                    daysCount[date.day] = count
                }
                items.value = days.value.map(day => day ? {day, count: daysCount[day], today: thisMonth && today.day === day} : null)
            }else{
                items.value = days.value.map(day => day ? {day, count: null, today: thisMonth && today.day === day} : null)
            }
        })

        const onClick = ({ day, count }: {day: number, count: number | null}) => !count ? undefined : () => {
            detail.value = date.ofDate(calendarDate.value.year, calendarDate.value.month, day)
        }

        return () => <div class={style.calendar}>
            <div class={["block", style.header]}>
                {weekdayNames.map(i => <div class={style.col}>
                    <b>{i}</b>
                </div>)}
            </div>
            <div class={style.body}>
                {items.value.map(item => <div class={style.col}>
                    {item && <div class={{"block": true, "is-link": !!item.count, [style.hoverable]: !!item.count}} onClick={onClick(item)}>
                        <b class={{"has-text-underline": item.today}}>{item.day}</b>
                        {(item.count || null) && <p class={style.count}>{item.count}项</p>}
                    </div>}
                </div>)}
            </div>
        </div>
    }
})
