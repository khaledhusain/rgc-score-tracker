import { createApp } from 'vue'
import router from './router'
import { createPinia } from 'pinia'
import App from './App.vue'

// Import styles globally here
import './style.css'
import './assets/auth.css'
import './assets/rounds.css'
import './assets/dashboard.css'
import './assets/entry.css'
import './assets/navbar.css'
import './assets/profile.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')