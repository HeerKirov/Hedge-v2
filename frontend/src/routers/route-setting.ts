import { RouteRecordRaw } from 'vue-router'

export default [
    {
        name: 'Setting',
        path: '/setting',
        component: () => import('@/views/Setting'),
        children: [
            {
                name: 'SettingIndex',
                path: '',
                redirect: {name: "SettingAppSecurity"}
            },
            {
                name: 'SettingAppSecurity',
                path: 'app/security',
                component: () => import('@/views/Setting/ViewAppSecurity')
            },
            {
                name: 'SettingAppWebAccess',
                path: 'app/web-access',
                component: () => import('@/views/Setting/ViewAppWebAccess')
            }
        ]
    }
] as RouteRecordRaw[]