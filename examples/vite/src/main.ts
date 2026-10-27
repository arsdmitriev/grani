import { createApp, h } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { createGrani } from 'grani-ui'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: App },
    { path: '/orders', component: App },
  ],
})

// The app's settings belong to its instance: language, size and zone are options here.
const app = createApp({ render: () => h(RouterView) })
  .use(router)
  .use(createGrani({ locale: 'en' }))
app.mount('#app')
