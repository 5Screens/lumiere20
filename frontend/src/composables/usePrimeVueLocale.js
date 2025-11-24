import { watch } from 'vue'
import { usePrimeVue } from 'primevue/config'
import { useI18n } from 'vue-i18n'

/**
 * Composable to synchronize PrimeVue locale with Vue-i18n
 * Updates PrimeVue locale whenever the language changes
 */
export function usePrimeVueLocale() {
  const primevue = usePrimeVue()
  const { locale, messages } = useI18n()

  // Watch for locale changes and update PrimeVue config
  watch(locale, (newLocale) => {
    const primeVueLocale = messages.value[newLocale]?.primevue
    
    if (primeVueLocale && primevue.config) {
      // Update PrimeVue locale configuration
      primevue.config.locale = primeVueLocale
      console.log(`PrimeVue locale updated to: ${newLocale}`)
    }
  }, { immediate: true })

  return {
    updateLocale: (newLocale) => {
      const primeVueLocale = messages.value[newLocale]?.primevue
      if (primeVueLocale && primevue.config) {
        primevue.config.locale = primeVueLocale
      }
    }
  }
}
