import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConnectionStore = defineStore('connection', () => {
  const isConnected = ref(true)
  const lastError = ref(null)
  const retryCount = ref(0)
  const isRetrying = ref(false)
  const maxRetries = 3
  const retryInterval = 5000 // 5 seconds

  let retryTimer = null

  function setDisconnected(error) {
    isConnected.value = false
    lastError.value = {
      type: error?.code || 'UNKNOWN',
      message: error?.message || 'Connection lost',
      timestamp: new Date().toISOString()
    }
  }

  function setConnected() {
    isConnected.value = true
    lastError.value = null
    retryCount.value = 0
    isRetrying.value = false
    if (retryTimer) {
      clearInterval(retryTimer)
      retryTimer = null
    }
  }

  async function checkConnection() {
    try {
      const response = await fetch('/api/v1/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (response.ok) {
        setConnected()
        return true
      }
    } catch (e) {
      // Still disconnected
    }
    return false
  }

  function startRetrying() {
    if (retryTimer) return
    
    isRetrying.value = true
    retryCount.value = 0
    
    retryTimer = setInterval(async () => {
      retryCount.value++
      const connected = await checkConnection()
      
      if (connected) {
        // Reload the page to restore state
        window.location.reload()
      } else if (retryCount.value >= maxRetries) {
        isRetrying.value = false
        clearInterval(retryTimer)
        retryTimer = null
      }
    }, retryInterval)
  }

  function manualRetry() {
    retryCount.value = 0
    isRetrying.value = true
    startRetrying()
  }

  function forceReload() {
    window.location.reload()
  }

  return {
    isConnected,
    lastError,
    retryCount,
    isRetrying,
    maxRetries,
    setDisconnected,
    setConnected,
    checkConnection,
    startRetrying,
    manualRetry,
    forceReload
  }
})
