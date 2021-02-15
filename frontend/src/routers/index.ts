import { createRouter, createWebHashHistory } from "vue-router"
import route from "./route"

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        ...route,
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