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

  const startUpload = (name = '') => {
    isUploading.value = true
    progress.value = 0
    fileName.value = name
    isCancelled.value = false
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
    isUploading.value = false
    progress.value = 0
    fileName.value = ''
  }

  const reset = () => {
    isUploading.value = false
    progress.value = 0
    fileName.value = ''
    isCancelled.value = false
  }

  return {
    isUploading,
    progress,
    fileName,
    isCancelled,
    startUpload,
    updateProgress,
    finishUpload,
    cancelUpload,
    reset
  }
})
