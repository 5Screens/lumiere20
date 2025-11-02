import { createRouter, createWebHistory } from 'vue-router'
import DemoView from '@/views/DemoView.vue'
import PortalView from '@/views/PortalView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/demo'
    },
    {
      path: '/demo',
      name: 'Demo',
      component: DemoView
    },
    {
      path: '/:portalCode',
      name: 'Portal',
      component: PortalView
    }
  ]
})

export default router
