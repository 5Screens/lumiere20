import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { createTTSConnection, isTTSSupported } from '@/services/tts'

/**
 * Composable for Text-to-Speech with streaming audio playback
 * @returns {Object} TTS state and methods
 */
export const useTTS = () => {
  const { locale, t } = useI18n()
  const toast = useToast()

  // State
  const isSpeaking = ref(false)
  const isConnecting = ref(false)
  const ttsConnection = ref(null)

  // Computed
  const isTTSAvailable = computed(() => {
    return isTTSSupported()
  })

  /**
   * Speak text using TTS
   * @param {string} text - Text to speak
   */
  const speak = async (text) => {
    if (!text || !text.trim()) {
      console.log('[useTTS] No text to speak')
      return
    }

    if (isSpeaking.value) {
      console.log('[useTTS] Already speaking, stopping first')
      stop()
    }

    console.log('[useTTS] Starting TTS for text:', text.substring(0, 50) + '...')
    isConnecting.value = true

    try {
      const connection = createTTSConnection(locale.value, {
        onOpen: () => {
          console.log('[useTTS] Connection opened')
        },
        onReady: () => {
          console.log('[useTTS] TTS ready, sending text')
          isConnecting.value = false
          connection.sendText(text)
        },
        onPlaybackStart: () => {
          console.log('[useTTS] Playback started')
          isSpeaking.value = true
        },
        onPlaybackEnd: () => {
          console.log('[useTTS] Playback ended')
          isSpeaking.value = false
        },
        onEnd: () => {
          console.log('[useTTS] Stream ended')
        },
        onError: (message) => {
          console.error('[useTTS] Error:', message)
          isConnecting.value = false
          isSpeaking.value = false
          
          toast.add({
            severity: 'error',
            summary: t('voice.error'),
            detail: message,
            life: 5000,
            position: 'top-center'
          })
        },
        onClose: () => {
          console.log('[useTTS] Connection closed')
          isConnecting.value = false
          isSpeaking.value = false
        }
      })

      if (connection) {
        ttsConnection.value = connection
      } else {
        isConnecting.value = false
      }
    } catch (error) {
      console.error('[useTTS] Failed to create connection:', error)
      isConnecting.value = false
      
      toast.add({
        severity: 'error',
        summary: t('voice.error'),
        detail: error.message,
        life: 5000,
        position: 'top-center'
      })
    }
  }

  /**
   * Stop TTS playback
   */
  const stop = () => {
    console.log('[useTTS] Stopping TTS - isSpeaking:', isSpeaking.value, 'hasConnection:', !!ttsConnection.value)
    
    if (ttsConnection.value) {
      console.log('[useTTS] Calling connection.stop()')
      ttsConnection.value.stop()
      console.log('[useTTS] Calling connection.close()')
      ttsConnection.value.close()
      ttsConnection.value = null
      console.log('[useTTS] Connection cleared')
    } else {
      console.log('[useTTS] No connection to stop')
    }
    
    isSpeaking.value = false
    isConnecting.value = false
    console.log('[useTTS] State reset - isSpeaking:', isSpeaking.value)
  }

  return {
    // State
    isSpeaking,
    isConnecting,
    isTTSAvailable,
    
    // Methods
    speak,
    stop
  }
}
