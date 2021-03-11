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
                name: 'MainAnnotations',
                path: 'annotations',
                component: () => import('@/views/Main/Annotations')
            }
        ]
    }
]