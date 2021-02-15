import { RouteRecordRaw } from "vue-router"

export default <RouteRecordRaw[]>[
    {
        name: 'Index',
        path: '/',
        component: () => import('@/views/Index'),
        meta: {
            title: "Hedge"
        }
    },
    {
        name: 'Init',
        path: '/init',
        component: () => import('@/views/Init'),
        meta: {
            title: "Hedge初始化向导"
        }
    },
    {
        name: 'Login',
        path: '/login',
        component: () => import('@/views/Login'),
        meta: {
            title: "Hedge"
        }
    }
]