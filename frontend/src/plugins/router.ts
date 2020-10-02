import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            name: 'Index',
            path: '/',
            component: () => import('../views/Index')
        },
        {
            name: 'Board',
            path: '/board',
            component: () => import('../views/Board'),
            children: [

            ]
        },
        {
            name: 'NotFound',
            path: '/:catchAll(.*)',
            component: () => import('../views/NotFound')
        }
    ]
})