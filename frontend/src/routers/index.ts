import { createRouter, createWebHashHistory } from "vue-router"
import route from "./route"
import mainRoute from "./route-main"

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        ...route,
        ...mainRoute,
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