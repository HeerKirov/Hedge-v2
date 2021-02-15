import { RouteRecordRaw } from "vue-router"

export default <RouteRecordRaw[]>[
    {
        name: 'Setting',
        path: '/setting',
        component: () => import('@/views.old/Setting'),
        meta: {
            title: "Hedge设置"
        },
        children: [
            {
                name: 'SettingIndex',
                path: '',
                redirect: {name: "SettingAppSecurity"}
            },
            {
                name: 'SettingAppSecurity',
                path: 'app/security',
                component: () => import('@/views.old/Setting/ViewAppSecurity')
            },
            {
                name: 'SettingWebAccess',
                path: 'app/web-access',
                component: () => import('@/views.old/Setting/ViewWebAccess')
            },
            {
                name: 'SettingBackup',
                path: 'app/backup',
                component: () => import('@/views.old/Setting/ViewBackup')
            },
            {
                name: 'SettingServer',
                path: 'advanced/server',
                component: () => import('@/views.old/Setting/ViewServer')
            },
            {
                name: 'SettingCli',
                path: 'advanced/cli',
                component: () => import('@/views.old/Setting/ViewCli')
            },
            {
                name: 'SettingChannel',
                path: 'advanced/channel',
                component: () => import('@/views.old/Setting/ViewChannel')
            }
        ]
    }
]