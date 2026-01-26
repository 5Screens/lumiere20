import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import authService from '@/services/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null)
  const token = ref(localStorage.getItem('portal_token') || null)
  const loading = ref(false)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const fullName = computed(() => {
    if (!user.value) return ''
    return `${user.value.first_name} ${user.value.last_name}`
  })
  const userEmail = computed(() => user.value?.email || '')

  // Actions
  const login = async (credentials) => {
    loading.value = true
    try {
      const result = await authService.login(credentials)
      token.value = result.token
      user.value = result.user
      localStorage.setItem('portal_token', result.token)
      return result
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('portal_token')
    }
  }

  const fetchProfile = async () => {
    if (!token.value) return null
    loading.value = true
    try {
      user.value = await authService.getProfile()
      return user.value
    } catch (error) {
      // Token invalid, logout
      await logout()
      throw error
    } finally {
      loading.value = false
    }
  }

  // Initialize: fetch profile if token exists
  const initialize = async () => {
    if (token.value) {
      try {
        await fetchProfile()
      } catch (error) {
        // Token expired or invalid
      }
    }
  }

  return {
    // State
    user,
    token,
    loading,
    // Getters
    isAuthenticated,
    fullName,
    userEmail,
    // Actions
    login,
    logout,
    fetchProfile,
    initialize
  }
}, {
  persist: {
    paths: ['token']
  }
})
