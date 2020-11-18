import { RouteRecordRaw } from "vue-router"


export default <RouteRecordRaw[]>[
    {
        name: 'Hedge',
        path: '/hedge',
        component: () => import('@/views/Hedge'),
        meta: {
            title: "Hedge"
        },
        children: [
            {
                name: 'HedgeIndex',
                path: '',
                component: () => import('@/views/Hedge/MainPanel/ViewIndex')
            },
            {
                name: 'HedgeImage',
                path: 'images',
                component: () => import('@/views/Hedge/MainPanel/ViewImages')
            },
            {
                name: 'HedgeImport',
                path: 'import',
                component: () => import('@/views/Hedge/MainPanel/ViewImport')
            },
            {
                name: 'HedgePartitions',
                path: 'partitions',
                component: () => import('@/views/Hedge/MainPanel/ViewPartitions')
            },
            {
                name: 'HedgePartitionsDetail',
                path: 'partitions/:partition([\\d-]+)',
                component: () => import('@/views/Hedge/MainPanel/ViewPartitionsDetail')
            },
            {
                name: 'HedgeAlbums',
                path: 'albums',
                component: () => import('@/views/Hedge/MainPanel/ViewAlbums')
            },
            {
                name: 'HedgeAlbumsDetail',
                path: 'albums/:id(\\d+)',
                component: () => import('@/views/Hedge/MainPanel/ViewAlbumsDetail')
            },
            {
                name: 'HedgeFolders',
                path: 'folders',
                component: () => import('@/views/Hedge/MainPanel/ViewFolders')
            },
            {
                name: 'HedgeFoldersDetail',
                path: 'folders/:id(tmp|\\d+)',
                component: () => import('@/views/Hedge/MainPanel/ViewFoldersDetail')
            },
            {
                name: 'HedgeTags',
                path: 'tags',
                component: () => import('@/views/Hedge/MainPanel/ViewTags')
            },
            {
                name: 'HedgeTopics',
                path: 'topics',
                component: () => import('@/views/Hedge/MainPanel/ViewTopics')
            },
            {
                name: 'HedgeTopicsDetail',
                path: 'topics/:id(\\d+)',
                component: () => import('@/views/Hedge/MainPanel/ViewTopicsDetail')
            },
            {
                name: 'HedgeAuthors',
                path: 'authors',
                component: () => import('@/views/Hedge/MainPanel/ViewAuthors')
            },
            {
                name: 'HedgeAuthorsDetail',
                path: 'authors/:id(\\d+)',
                component: () => import('@/views/Hedge/MainPanel/ViewAuthorsDetail')
            },
        ]
    }
]