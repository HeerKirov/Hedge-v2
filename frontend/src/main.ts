import { createApp } from "vue"
import App from '@/views/App'
import router from '@/routers'
import { createService } from './functions/service'
import '@/styles'

const service = createService()

createApp(App)
    .use(router)
    .use(service)
    .mount('#app')
