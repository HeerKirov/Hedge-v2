import { RouteRecordRaw } from "vue-router"

export default [
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
    }
] as RouteRecordRaw[]