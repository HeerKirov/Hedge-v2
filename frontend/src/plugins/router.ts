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
            name: 'Init',
            path: '/init',
            component: () => import('../views/Init')
        },
        {
            name: 'Login',
            path: '/login',
            component: () => import('../views/Login')
        },
        {
            name: 'Start',
            path: '/start',
            component: () => import('../views/Start'),
            children: [
                {
                    name: 'StartIndex',
                    path: '',
                    component: () => import('../views/StartIndex')
                },
                {
                    name: 'StartNew',
                    path: 'new',
                    component: () => import('../views/StartNew')
                },
                {
                    name: 'StartImport',
                    path: 'import',
                    component: () => import('../views/StartImport')
                }
            ]
        },
        {
            name: 'Hedge',
            path: '/hedge',
            component: () => import('../views/Hedge'),
            children: [
                {
                    name: 'HedgeIndex',
                    path: '',
                    component: () => import('../views/HedgeIndex')
                },
                {
                    name: 'HedgeImage',
                    path: 'images',
                    component: () => import('../views/HedgeImage')
                }
            ]
        },
        {
            name: 'NotFound',
            path: '/:catchAll(.*)',
            component: () => import('../views/NotFound')
        }
    ]
})