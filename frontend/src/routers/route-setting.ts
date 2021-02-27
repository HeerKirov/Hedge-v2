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
                name: 'SettingAppearance',
                path: 'app/appearance',
                component: () => import('@/views/Setting/AppAppearance')
            },
            {
                name: 'SettingWebAccess',
                path: 'app/web-access',
                component: () => import('@/views/Setting/AppWebAccess')
            },
            {
                name: 'SettingBackup',
                path: 'app/backup',
                component: () => import('@/views/Setting/AppBackup')
            },
            {
                name: 'SettingDBMeta',
                path: 'db/meta',
                component: () => import('@/views/Setting/DBMeta')
            },
            {
                name: 'SettingDBQuery',
                path: 'db/query',
                component: () => import('@/views/Setting/DBQuery')
            },
            {
                name: 'SettingDBOrigin',
                path: 'db/origin',
                component: () => import('@/views/Setting/DBOrigin')
            },
            {
                name: 'SettingDBImport',
                path: 'db/import',
                component: () => import('@/views/Setting/DBImport')
            },
            {
                name: 'SettingServer',
                path: 'advanced/server',
                component: () => import('@/views/Setting/AdvancedServer')
            },
            {
                name: 'SettingCli',
                path: 'advanced/cli',
                component: () => import('@/views/Setting/AdvancedCli')
            },
            {
                name: 'SettingProxy',
                path: 'advanced/proxy',
                component: () => import('@/views/Setting/AdvancedProxy')
            },
            {
                name: 'SettingChannel',
                path: 'advanced/channel',
                component: () => import('@/views/Setting/AdvancedChannel')
            }
        ]
    }
]