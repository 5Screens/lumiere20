import { createRouter, createWebHistory } from 'vue-router'
import PortalWrapper from '@/views/PortalWrapper.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/demo-portal'
    },
    {
      path: '/:portalCode',
      name: 'Portal',
      component: PortalWrapper
    }
  ]
})

export default router
