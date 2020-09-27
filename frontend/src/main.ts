import { createApp } from 'vue'
import App from './App'
import router from './routers'
import './styles/index.scss'
import 'bulma/css/bulma.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

createApp(App)
    .use(router)
    .mount('#app')
