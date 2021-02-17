import { RouteRecordRaw } from "vue-router"

export default <RouteRecordRaw[]>[
    {
        name: 'Setting',
        path: '/setting',
        component: () => import('@/views/Setting'),
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
                component: () => import('@/views/Setting/AppSecurity')
            },
            {
                name: 'SettingWebAccess',
                path: 'app/web-access',
                component: () => import('@/views/Setting/WebAccess')
            },
            {
                name: 'SettingBackup',
                path: 'app/backup',
                component: () => import('@/views/Setting/Backup')
            },
            {
                name: 'SettingServer',
                path: 'advanced/server',
                component: () => import('@/views/Setting/Server')
            },
            {
                name: 'SettingCli',
                path: 'advanced/cli',
                component: () => import('@/views/Setting/Cli')
            },
            {
                name: 'SettingChannel',
                path: 'advanced/channel',
                component: () => import('@/views/Setting/Channel')
            }
        ]
    }
]