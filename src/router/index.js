import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import HistoryView from '../views/HistoryView.vue'
import QuoteView from '../views/QuoteView.vue'
import SuccessView from '../views/SuccessView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/devis', name: 'quote', component: QuoteView },
    { path: '/history', name: 'history', component: HistoryView },
    { path: '/success', name: 'success', component: SuccessView },
  ],
})

export default router
