import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('/portal/'),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/:portalCode',
      name: 'portal',
      component: () => import('@/views/PortalWrapper.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/demo'
    }
  ]
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  // Skip auth check for login page
  if (to.name === 'login') {
    return next()
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth !== false) {
    const token = localStorage.getItem('portal_token')
    
    if (!token) {
      // Redirect to login with return URL
      return next({
        name: 'login',
        query: { 
          redirect: to.fullPath,
          portal: to.params.portalCode || null
        }
      })
    }

    // Token exists, initialize auth store if needed
    const { useAuthStore } = await import('@/stores/authStore')
    const authStore = useAuthStore()
    
    if (!authStore.user) {
      try {
        await authStore.fetchProfile()
      } catch (error) {
        // Token invalid, redirect to login
        return next({
          name: 'login',
          query: { 
            redirect: to.fullPath,
            portal: to.params.portalCode || null
          }
        })
      }
    }
  }

  next()
})

export default router
