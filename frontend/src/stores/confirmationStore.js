import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfirmationStore = defineStore('confirmationStore', () => {
  // État
  const isVisible = ref(false)
  const confirmationMessage = ref('')
  const resolvePromise = ref(null)
  const rejectPromise = ref(null)

  // Actions
  function confirm(message) {
    confirmationMessage.value = message
    isVisible.value = true

    // Retourner une promesse qui sera résolue lorsque l'utilisateur confirme ou annule
    return new Promise((resolve, reject) => {
      resolvePromise.value = resolve
      rejectPromise.value = reject
    })
  }

  function handleConfirm() {
    isVisible.value = false
    if (resolvePromise.value) {
      resolvePromise.value(true)
      resolvePromise.value = null
      rejectPromise.value = null
    }
  }

  function handleCancel() {
    isVisible.value = false
    if (rejectPromise.value) {
      rejectPromise.value(false)
      resolvePromise.value = null
      rejectPromise.value = null
    }
  }

  return {
    isVisible,
    confirmationMessage,
    confirm,
    handleConfirm,
    handleCancel
  }
})
