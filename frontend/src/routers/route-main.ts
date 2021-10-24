import { RouteRecordRaw } from "vue-router"

export default <RouteRecordRaw[]>[
    {
        name: 'Main',
        path: '/main',
        component: () => import('@/views/Main'),
        meta: {
            title: "Hedge"
        },
        children: [
            {
                name: 'MainIndex',
                path: '',
                component: () => import('@/views/Main/Index/index')
            },
            {
                name: 'MainIllusts',
                path: 'illusts',
                component: () => import('@/views/Main/Illusts')
            },
            {
                name: 'MainPartitions',
                path: 'partitions',
                component: () => import('@/views/Main/Partitions')
            },
            {
                name: 'MainAlbums',
                path: 'albums',
                component: () => import('@/views/Main/Albums')
            },
            {
                name: 'MainTags',
                path: 'tags',
                component: () => import('@/views/Main/Tags')
            },
            {
                name: 'MainAuthors',
                path: 'authors',
                component: () => import('@/views/Main/Authors')
            },
            {
                name: 'MainTopics',
                path: 'topics',
                component: () => import('@/views/Main/Topics')
            },
            {
                name: 'MainAnnotations',
                path: 'annotations',
                component: () => import('@/views/Main/Annotations')
            },
            {
                name: 'MainImport',
                path: 'import',
                component: () => import('@/views/Main/Import')
            },
            {
                name: 'MainSourceImage',
                path: 'source-images',
                component: () => import('@/views/Main/SourceImages')
            }
        ]
    }
]
