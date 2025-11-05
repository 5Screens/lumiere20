import { createRouter, createWebHistory } from 'vue-router'
import DemoView from '@/views/DemoView.vue'
import PortalView from '@/views/PortalView.vue'
import PortalViewV1 from '@/views/PortalViewV1.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/demo-portal'
    },
    {
      path: '/demo',
      name: 'Demo',
      component: DemoView
    },
    {
      path: '/portal-poc/:portalCode',
      name: 'PortalPOC',
      component: PortalView
    },
    {
      path: '/:portalCode',
      name: 'Portal',
      component: PortalViewV1
    }
  ]
})

export default router
