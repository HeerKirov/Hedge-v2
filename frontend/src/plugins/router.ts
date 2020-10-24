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
                    component: () => import('../views/Hedge/MainPanel/ViewImages')
                },
                {
                    name: 'HedgeRecent',
                    path: 'recent',
                    component: () => import('../views/Hedge/MainPanel/ViewRecent')
                },
                {
                    name: 'HedgePartitions',
                    path: 'partitions',
                    component: () => import('../views/Hedge/MainPanel/ViewPartitions')
                },
                {
                    name: 'HedgePartitionsDetail',
                    path: 'partitions/:partition([\\d-]+)',
                    component: () => import('../views/Hedge/MainPanel/ViewPartitionsDetail')
                },
                {
                    name: 'HedgeAlbums',
                    path: 'albums',
                    component: () => import('../views/Hedge/MainPanel/ViewAlbums')
                },
                {
                    name: 'HedgeAlbumsDetail',
                    path: 'albums/:id(\\d+)',
                    component: () => import('../views/Hedge/MainPanel/ViewAlbumsDetail')
                },
                {
                    name: 'HedgeFolders',
                    path: 'folders',
                    component: () => import('../views/Hedge/MainPanel/ViewFolders')
                },
                {
                    name: 'HedgeFoldersDetail',
                    path: 'folders/:id(\\d+)',
                    component: () => import('../views/Hedge/MainPanel/ViewFoldersDetail')
                },
                {
                    name: 'HedgeTags',
                    path: 'tags',
                    component: () => import('../views/Hedge/MainPanel/ViewTags')
                },
                {
                    name: 'HedgeTopics',
                    path: 'topics',
                    component: () => import('../views/Hedge/MainPanel/ViewTopics')
                },
                {
                    name: 'HedgeTopicsDetail',
                    path: 'topics/:id(\\d+)',
                    component: () => import('../views/Hedge/MainPanel/ViewTopicsDetail')
                },
                {
                    name: 'HedgeAuthors',
                    path: 'authors',
                    component: () => import('../views/Hedge/MainPanel/ViewAuthors')
                },
                {
                    name: 'HedgeAuthorsDetail',
                    path: 'authors/:id(\\d+)',
                    component: () => import('../views/Hedge/MainPanel/ViewAuthorsDetail')
                },
            ]
        },
        {
            name: 'Setting',
            path: '/setting',
            component: () => import('../views/Setting'),
            children: [
                {
                    name: 'SettingIndex',
                    path: '',
                    redirect: {name: "SettingAppSecurity"}
                },
                {
                    name: 'SettingAppSecurity',
                    path: 'app/security',
                    component: () => import('../views/Setting/ViewAppSecurity')
                },
                {
                    name: 'SettingAppWebAccess',
                    path: 'app/web-access',
                    component: () => import('../views/Setting/ViewAppWebAccess')
                }
            ]
        },
        {
            name: 'Guide',
            path: '/guide',
            component: () => import('../views/Guide'),
        },
        {
            name: 'NotFound',
            path: '/:catchAll(.*)',
            component: () => import('../views/NotFound')
        }
    ]
})