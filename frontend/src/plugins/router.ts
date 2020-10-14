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
                    component: () => import('../views/Start/ViewIndex')
                },
                {
                    name: 'StartNew',
                    path: 'new',
                    component: () => import('../views/Start/ViewNew')
                },
                {
                    name: 'StartImport',
                    path: 'import',
                    component: () => import('../views/Start/ViewImport')
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
                    component: () => import('../views/Hedge/MainPanel/ViewIndex')
                },
                {
                    name: 'HedgeImage',
                    path: 'images',
                    component: () => import('../views/Hedge/MainPanel/ViewImage')
                },
                {
                    name: 'HedgeRecent',
                    path: 'recent',
                    component: () => import('../views/Hedge/MainPanel/ViewRecent')
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