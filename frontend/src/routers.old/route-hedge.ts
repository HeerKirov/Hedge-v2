import { RouteRecordRaw } from "vue-router"


export default <RouteRecordRaw[]>[
    {
        name: 'Hedge',
        path: '/hedge',
        component: () => import('@/views.old/Hedge'),
        meta: {
            title: "Hedge"
        },
        children: [
            {
                name: 'HedgeIndex',
                path: '',
                component: () => import('@/views.old/Hedge/MainPanel/ViewIndex')
            },
            {
                name: 'HedgeImage',
                path: 'images',
                component: () => import('@/views.old/Hedge/MainPanel/ViewImages')
            },
            {
                name: 'HedgeImport',
                path: 'import',
                component: () => import('@/views.old/Hedge/MainPanel/ViewImport')
            },
            {
                name: 'HedgePartitions',
                path: 'partitions',
                component: () => import('@/views.old/Hedge/MainPanel/ViewPartitions')
            },
            {
                name: 'HedgePartitionsDetail',
                path: 'partitions/:partition([\\d-]+)',
                component: () => import('@/views.old/Hedge/MainPanel/ViewPartitionsDetail')
            },
            {
                name: 'HedgeAlbums',
                path: 'albums',
                component: () => import('@/views.old/Hedge/MainPanel/ViewAlbums')
            },
            {
                name: 'HedgeAlbumsDetail',
                path: 'albums/:id(\\d+)',
                component: () => import('@/views.old/Hedge/MainPanel/ViewAlbumsDetail')
            },
            {
                name: 'HedgeFolders',
                path: 'folders',
                component: () => import('@/views.old/Hedge/MainPanel/ViewFolders')
            },
            {
                name: 'HedgeFoldersDetail',
                path: 'folders/:id(tmp|\\d+)',
                component: () => import('@/views.old/Hedge/MainPanel/ViewFoldersDetail')
            },
            {
                name: 'HedgeTags',
                path: 'tags',
                component: () => import('@/views.old/Hedge/MainPanel/ViewTags')
            },
            {
                name: 'HedgeAuthors',
                path: 'authors',
                component: () => import('@/views.old/Hedge/MainPanel/ViewAuthors')
            },
            {
                name: 'HedgeAuthorsDetail',
                path: 'authors/:id(\\d+)',
                component: () => import('@/views.old/Hedge/MainPanel/ViewAuthorsDetail')
            },
        ]
    }
]
