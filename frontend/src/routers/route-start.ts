import { RouteRecordRaw } from 'vue-router'

export default [
    {
        name: 'Start',
        path: '/start',
        component: () => import('@/views/Start'),
        children: [
            {
                name: 'StartIndex',
                path: '',
                component: () => import('@/views/Start/ViewIndex')
            },
            {
                name: 'StartNew',
                path: 'new',
                component: () => import('@/views/Start/ViewNew')
            },
            {
                name: 'StartImport',
                path: 'import',
                component: () => import('@/views/Start/ViewImport')
            }
        ]
    }
] as RouteRecordRaw[]