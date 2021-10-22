import { ref, Ref } from "vue"
import { installation } from "@/functions/utils/basic"
import { useLocalStorageWithDefault } from "@/functions/app"
import { datetime, LocalDate } from "@/utils/datetime"

export interface PartitionContext {
    viewMode: Ref<"calendar" | "timeline">
    calendarDate: Ref<YearAndMonth>
    today: LocalDate
}

interface YearAndMonth {
    year: number
    month: number
}

export const [installPartitionContext, usePartitionContext] = installation(function (): PartitionContext {
    const viewMode = useLocalStorageWithDefault<"calendar" | "timeline">("partition-list/view-mode", "calendar")

    const today = datetime.now()
    const calendarDate = ref<YearAndMonth>({year: today.year, month: today.month})

    return {viewMode, calendarDate, today}
})
