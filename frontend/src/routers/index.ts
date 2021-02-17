import { createRouter, createWebHashHistory } from "vue-router"
import route from "./route"
import mainRoute from "./route-main"
import settingRoute from "./route-setting"
import guideRoute from "./route-guide"

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        ...route,
        ...mainRoute,
        ...settingRoute,
        ...guideRoute,
        {
            name: 'NotFound',
            path: '/:catchAll(.*)',
            component: () => import('@/views/NotFound'),
            meta: {
                title: "Hedge"
            }
        }
    ]
})