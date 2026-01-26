/**
 * Seed file for languages table
 * Contains all supported languages with active status for fr, en, es, pt, de, it
 */

const languages = [
  // Active languages (fr, en, es, pt, de, it)
  { code: 'fr', name: 'Français', name_en: 'French', flag_code: 'fr', is_active: true },
  { code: 'en', name: 'English', name_en: 'English', flag_code: 'gb', is_active: true },
  { code: 'es', name: 'Español', name_en: 'Spanish', flag_code: 'es', is_active: true },
  { code: 'pt', name: 'Português', name_en: 'Portuguese', flag_code: 'pt', is_active: true },
  { code: 'de', name: 'Deutsch', name_en: 'German', flag_code: 'de', is_active: true },
  { code: 'it', name: 'Italiano', name_en: 'Italian', flag_code: 'it', is_active: true },
  
  // Inactive languages (available for future activation)
  { code: 'nl', name: 'Nederlands', name_en: 'Dutch', flag_code: 'nl', is_active: false },
  { code: 'pl', name: 'Polski', name_en: 'Polish', flag_code: 'pl', is_active: false },
  { code: 'ru', name: 'Русский', name_en: 'Russian', flag_code: 'ru', is_active: false },
  { code: 'uk', name: 'Українська', name_en: 'Ukrainian', flag_code: 'ua', is_active: false },
  { code: 'cs', name: 'Čeština', name_en: 'Czech', flag_code: 'cz', is_active: false },
  { code: 'sk', name: 'Slovenčina', name_en: 'Slovak', flag_code: 'sk', is_active: false },
  { code: 'hu', name: 'Magyar', name_en: 'Hungarian', flag_code: 'hu', is_active: false },
  { code: 'ro', name: 'Română', name_en: 'Romanian', flag_code: 'ro', is_active: false },
  { code: 'bg', name: 'Български', name_en: 'Bulgarian', flag_code: 'bg', is_active: false },
  { code: 'hr', name: 'Hrvatski', name_en: 'Croatian', flag_code: 'hr', is_active: false },
  { code: 'sl', name: 'Slovenščina', name_en: 'Slovenian', flag_code: 'si', is_active: false },
  { code: 'sr', name: 'Српски', name_en: 'Serbian', flag_code: 'rs', is_active: false },
  { code: 'el', name: 'Ελληνικά', name_en: 'Greek', flag_code: 'gr', is_active: false },
  { code: 'tr', name: 'Türkçe', name_en: 'Turkish', flag_code: 'tr', is_active: false },
  { code: 'sv', name: 'Svenska', name_en: 'Swedish', flag_code: 'se', is_active: false },
  { code: 'da', name: 'Dansk', name_en: 'Danish', flag_code: 'dk', is_active: false },
  { code: 'no', name: 'Norsk', name_en: 'Norwegian', flag_code: 'no', is_active: false },
  { code: 'fi', name: 'Suomi', name_en: 'Finnish', flag_code: 'fi', is_active: false },
  { code: 'et', name: 'Eesti', name_en: 'Estonian', flag_code: 'ee', is_active: false },
  { code: 'lv', name: 'Latviešu', name_en: 'Latvian', flag_code: 'lv', is_active: false },
  { code: 'lt', name: 'Lietuvių', name_en: 'Lithuanian', flag_code: 'lt', is_active: false },
  { code: 'zh', name: '中文', name_en: 'Chinese', flag_code: 'cn', is_active: false },
  { code: 'ja', name: '日本語', name_en: 'Japanese', flag_code: 'jp', is_active: false },
  { code: 'ko', name: '한국어', name_en: 'Korean', flag_code: 'kr', is_active: false },
  { code: 'ar', name: 'العربية', name_en: 'Arabic', flag_code: 'sa', is_active: false },
  { code: 'he', name: 'עברית', name_en: 'Hebrew', flag_code: 'il', is_active: false },
  { code: 'hi', name: 'हिन्दी', name_en: 'Hindi', flag_code: 'in', is_active: false },
  { code: 'th', name: 'ไทย', name_en: 'Thai', flag_code: 'th', is_active: false },
  { code: 'vi', name: 'Tiếng Việt', name_en: 'Vietnamese', flag_code: 'vn', is_active: false },
  { code: 'id', name: 'Bahasa Indonesia', name_en: 'Indonesian', flag_code: 'id', is_active: false },
  { code: 'ms', name: 'Bahasa Melayu', name_en: 'Malay', flag_code: 'my', is_active: false },
  { code: 'tl', name: 'Tagalog', name_en: 'Filipino', flag_code: 'ph', is_active: false },
];

/**
 * Seed languages into the database
 * @param {import('@prisma/client').PrismaClient} prisma 
 */
async function seedLanguages(prisma) {
  console.log('Seeding languages...');
  
  for (const lang of languages) {
    await prisma.languages.upsert({
      where: { code: lang.code },
      update: {
        name: lang.name,
        name_en: lang.name_en,
        flag_code: lang.flag_code,
        // Don't update is_active to preserve user changes
      },
      create: lang,
    });
  }
  
  console.log(`Seeded ${languages.length} languages`);
}

module.exports = { seedLanguages, languages };
