/**
 * Languages Service
 * Handles API calls for language management
 */

import api from './api'

const BASE_URL = '/languages'

// Default fallback languages if API fails
const DEFAULT_LANGUAGES = [
  { code: 'en', name: 'English', name_en: 'English', flag_code: 'gb' },
  { code: 'fr', name: 'Français', name_en: 'French', flag_code: 'fr' }
]

/**
 * Convert country code to flag emoji (e.g., 'fr' -> '🇫🇷')
 * @param {string} countryCode - Two-letter country code
 * @returns {string} Flag emoji
 */
export function getFlagEmoji(countryCode) {
  if (!countryCode) return '🏳️'
  const code = countryCode.toUpperCase()
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

/**
 * Get all active languages for the language selector
 * @returns {Promise<Array>} List of active languages
 */
export async function getActiveLanguages() {
  const response = await api.get(`${BASE_URL}/active`)
  return response.data
}

/**
 * Get all active languages with flag emojis
 * @returns {Promise<Array>} List of active languages with flag property
 */
export async function getActiveLanguagesWithFlags() {
  try {
    const languages = await getActiveLanguages()
    return languages.map(lang => ({
      code: lang.code,
      name: lang.name,
      name_en: lang.name_en,
      flag_code: lang.flag_code,
      flag: getFlagEmoji(lang.flag_code)
    }))
  } catch (error) {
    console.error('Failed to load active languages:', error)
    // Return fallback with flags
    return DEFAULT_LANGUAGES.map(lang => ({
      ...lang,
      flag: getFlagEmoji(lang.flag_code)
    }))
  }
}

/**
 * Get all languages (including inactive)
 * @returns {Promise<Array>} List of all languages
 */
export async function getAllLanguages() {
  const response = await api.get(BASE_URL)
  return response.data
}

export default {
  getActiveLanguages,
  getActiveLanguagesWithFlags,
  getAllLanguages,
  getFlagEmoji,
  DEFAULT_LANGUAGES
}
