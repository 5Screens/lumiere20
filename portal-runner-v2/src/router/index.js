import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/:portalCode',
      name: 'portal',
      component: () => import('@/views/PortalWrapper.vue')
    },
    {
      path: '/',
      redirect: '/demo'
    }
  ]
})

export default router
