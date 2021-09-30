import { inject, InjectionKey, provide, Ref } from "vue"

export interface DashboardZoomProps {
    enable: Ref<boolean>
    zoom: Ref<number>
}

export const dashboardZoomInjection: InjectionKey<DashboardZoomProps> = Symbol()

export function installDashboardZoom(enable: Ref<boolean>, zoom: Ref<number>) {
    provide(dashboardZoomInjection, {enable, zoom})
}

export function useDashboardZoom(): DashboardZoomProps {
    return inject(dashboardZoomInjection)!
}
