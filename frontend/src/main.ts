import { createApp } from "vue"
import App from "@/views/App"
import router from "@/routers"
import "@/styles"

createApp(App)
    .use(router)
    .mount('#app')
