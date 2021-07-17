import { InjectionKey, Ref } from "vue"

export interface DashboardZoomProps {
    zoom: Ref<number>
}

export const dashboardZoomInjection: InjectionKey<DashboardZoomProps> = Symbol()
