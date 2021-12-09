import { ref, Ref, watch } from "vue"
import { installation } from "@/functions/utils/basic"
import { useLocalStorageWithDefault } from "@/functions/app"
import { useRouterQueryLocalDate } from "@/functions/feature/router"
import { date, datetime, LocalDate } from "@/utils/datetime"
import { useSideBarContext } from "../inject"

export interface PartitionContext {
    viewMode: Ref<"calendar" | "timeline">
    calendarDate: Ref<YearAndMonth>
    today: LocalDate
    detail: Ref<LocalDate | null>
}

interface YearAndMonth {
    year: number
    month: number
}

export const [installPartitionContext, usePartitionContext] = installation(function (): PartitionContext {
    const viewMode = useLocalStorageWithDefault<"calendar" | "timeline">("partition-list/view-mode", "calendar")

    const today = datetime.now()
    const calendarDate = ref<YearAndMonth>({year: today.year, month: today.month})

    const detail = useRouterQueryLocalDate("MainPartitions", "detail")

    const { pushSubItem } = useSideBarContext()
    watch(detail, d => {
        if(d != null) {
            const str = date.toISOString(d)
            pushSubItem(str, str)
        }
    })

    return {viewMode, calendarDate, today, detail}
})
