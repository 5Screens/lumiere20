import { createI18n } from 'vue-i18n'
import fr from './fr'
import en from './en'
import es from './es'
import pt from './pt'

const messages = {
  fr,
  en,
  es,
  pt
}

export default createI18n({
  legacy: false,
  // La locale sera définie dans main.js à partir du store
  fallbackLocale: 'en', // langue de secours
  messages,
  missingWarn: false, // Disable missing key warnings in console
  fallbackWarn: false, // Disable fallback warnings in console
  missing: (locale, key) => {
    // Return the key itself when translation is missing
    // This makes it easier to spot missing translations visually
    return key;
  }
})
