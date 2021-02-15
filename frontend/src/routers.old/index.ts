import { createRouter, createWebHashHistory } from "vue-router"
import route from "./route"
import routeHedge from "./route-hedge"
import routeSetting from "./route-setting"
import routeGuide from "./route-guide"

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        ...route,
        ...routeHedge,
        ...routeSetting,
        ...routeGuide,
        {
            name: 'NotFound',
            path: '/:catchAll(.*)',
            component: () => import('@/views.old/NotFound'),
            meta: {
                title: "Hedge"
            }
        }
    ]
})