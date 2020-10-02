import { createApp } from 'vue'
import App from './views/App'
import router from './plugins/router'
import './styles'

createApp(App)
    .use(router)
    .mount('#app')
