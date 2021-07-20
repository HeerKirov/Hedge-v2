import { InjectionKey, Ref } from "vue"

export interface DashboardZoomProps {
    enable: Ref<boolean>
    zoom: Ref<number>
}

export const dashboardZoomInjection: InjectionKey<DashboardZoomProps> = Symbol()
