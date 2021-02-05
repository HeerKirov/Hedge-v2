import { createApp } from "vue"
import { createService } from '@/functions/service'
import App from '@/views/App'
import router from '@/routers'
import '@/styles'

const service = createService()

createApp(App)
    .use(router)
    .use(service)
    .mount('#app')
