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
  locale: 'fr', // langue par défaut
  fallbackLocale: 'en', // langue de secours
  messages
})
