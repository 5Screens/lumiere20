import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Store for managing file upload state and progress
 * Used for headless toast display during attachment uploads
 */
export const useUploadStore = defineStore('upload', () => {
  const isUploading = ref(false)
  const progress = ref(0)
  const fileName = ref('')
  const isCancelled = ref(false)
  const abortController = ref(null)

  const startUpload = (name = '') => {
    isUploading.value = true
    progress.value = 0
    fileName.value = name
    isCancelled.value = false
    abortController.value = null
  }

  const registerAbortController = (controller) => {
    abortController.value = controller
  }

  const updateProgress = (value) => {
    progress.value = value
  }

  const finishUpload = () => {
    progress.value = 100
    // Auto-close after a short delay
    setTimeout(() => {
      isUploading.value = false
      progress.value = 0
      fileName.value = ''
    }, 1500)
  }

  const cancelUpload = () => {
    isCancelled.value = true
    if (abortController.value) {
      abortController.value.abort()
    }
    isUploading.value = false
    progress.value = 0
    fileName.value = ''
    abortController.value = null
  }

  const reset = () => {
    isUploading.value = false
    progress.value = 0
    fileName.value = ''
    isCancelled.value = false
    abortController.value = null
  }

  return {
    isUploading,
    progress,
    fileName,
    isCancelled,
    abortController,
    startUpload,
    registerAbortController,
    updateProgress,
    finishUpload,
    cancelUpload,
    reset
  }
})
