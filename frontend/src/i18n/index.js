import { createI18n } from 'vue-i18n'
import fr from './fr.js'
import en from './en.js'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'fr',
  fallbackLocale: 'en',
  messages: {
    fr,
    en
  }
})

export default i18n
