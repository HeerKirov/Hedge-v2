import { RouteRecordRaw } from "vue-router"

export default <RouteRecordRaw[]>[
    {
        name: 'Guide',
        path: '/guide',
        component: () => import('@/views/Guide'),
        meta: {
            title: "Hedge帮助向导"
        },
        children: [
            {
                name: 'GuideIndex',
                path: '',
                redirect: {name: "GuideBeginIntroduction"}
            },
            {
                name: 'GuideBeginIntroduction',
                path: 'begin/introduction',
                component: () => import('@/views/Guide/BeginIntroduction')
            }
        ]
    }
]