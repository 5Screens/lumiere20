const { prisma } = require('../client');

/**
 * Public holidays seed for France (FR), Portugal (PT), England (GB), and Spain (ES).
 *
 * Each holiday is stored ONCE with an array of country_codes for all countries
 * where it applies. The "name" field is the English reference name; translations
 * are stored in the translated_fields table (entity_type = 'holidays', field_name = 'name').
 *
 * Fixed holidays (same date every year) use is_recurring = true.
 * Moveable holidays (Easter-based, etc.) use is_recurring = false
 * and are seeded for year 2025 as a reference.
 */

const ENTITY_TYPE = 'holidays';

// ============================================================
// Holidays data — one entry per unique holiday
// ============================================================
const holidaysData = [
  // ---- Shared across multiple countries (fixed) ----
  {
    date: '2025-01-01', name: "New Year's Day", country_codes: ['FR', 'PT', 'GB', 'ES'], is_recurring: true,
    translations: { en: "New Year's Day", fr: 'Jour de l\'An', pt: 'Ano Novo', es: 'Año Nuevo' },
  },
  {
    date: '2025-05-01', name: 'Labour Day', country_codes: ['FR', 'PT', 'ES'], is_recurring: true,
    translations: { en: 'Labour Day', fr: 'Fête du Travail', pt: 'Dia do Trabalhador', es: 'Día del Trabajo' },
  },
  {
    date: '2025-08-15', name: 'Assumption of Mary', country_codes: ['FR', 'PT', 'ES'], is_recurring: true,
    translations: { en: 'Assumption of Mary', fr: 'Assomption', pt: 'Assunção de Nossa Senhora', es: 'Asunción de la Virgen' },
  },
  {
    date: '2025-11-01', name: "All Saints' Day", country_codes: ['FR', 'PT', 'ES'], is_recurring: true,
    translations: { en: "All Saints' Day", fr: 'Toussaint', pt: 'Dia de Todos os Santos', es: 'Día de Todos los Santos' },
  },
  {
    date: '2025-12-25', name: 'Christmas Day', country_codes: ['FR', 'PT', 'GB', 'ES'], is_recurring: true,
    translations: { en: 'Christmas Day', fr: 'Noël', pt: 'Natal', es: 'Navidad' },
  },
  {
    date: '2025-12-08', name: 'Immaculate Conception', country_codes: ['PT', 'ES'], is_recurring: true,
    translations: { en: 'Immaculate Conception', fr: 'Immaculée Conception', pt: 'Imaculada Conceição', es: 'Inmaculada Concepción' },
  },
  {
    date: '2025-04-18', name: 'Good Friday', country_codes: ['PT', 'GB', 'ES'], is_recurring: false,
    translations: { en: 'Good Friday', fr: 'Vendredi Saint', pt: 'Sexta-feira Santa', es: 'Viernes Santo' },
  },
  {
    date: '2025-04-21', name: 'Easter Monday', country_codes: ['FR', 'GB'], is_recurring: false,
    translations: { en: 'Easter Monday', fr: 'Lundi de Pâques', pt: 'Segunda-feira de Páscoa', es: 'Lunes de Pascua' },
  },

  // ---- France only (fixed) ----
  {
    date: '2025-05-08', name: 'Victory in Europe Day', country_codes: ['FR'], is_recurring: true,
    translations: { en: 'Victory in Europe Day', fr: 'Victoire 1945', pt: 'Dia da Vitória na Europa', es: 'Día de la Victoria en Europa' },
  },
  {
    date: '2025-07-14', name: 'Bastille Day', country_codes: ['FR'], is_recurring: true,
    translations: { en: 'Bastille Day', fr: 'Fête nationale', pt: 'Dia da Bastilha', es: 'Día de la Bastilla' },
  },
  {
    date: '2025-11-11', name: 'Armistice Day', country_codes: ['FR'], is_recurring: true,
    translations: { en: 'Armistice Day', fr: 'Armistice', pt: 'Dia do Armistício', es: 'Día del Armisticio' },
  },
  // France only (moveable)
  {
    date: '2025-05-29', name: 'Ascension Day', country_codes: ['FR'], is_recurring: false,
    translations: { en: 'Ascension Day', fr: 'Ascension', pt: 'Dia da Ascensão', es: 'Día de la Ascensión' },
  },
  {
    date: '2025-06-09', name: 'Whit Monday', country_codes: ['FR'], is_recurring: false,
    translations: { en: 'Whit Monday', fr: 'Lundi de Pentecôte', pt: 'Segunda-feira de Pentecostes', es: 'Lunes de Pentecostés' },
  },

  // ---- Portugal only (fixed) ----
  {
    date: '2025-04-25', name: 'Freedom Day', country_codes: ['PT'], is_recurring: true,
    translations: { en: 'Freedom Day', fr: 'Jour de la Liberté', pt: 'Dia da Liberdade', es: 'Día de la Libertad' },
  },
  {
    date: '2025-06-10', name: 'Portugal Day', country_codes: ['PT'], is_recurring: true,
    translations: { en: 'Portugal Day', fr: 'Jour du Portugal', pt: 'Dia de Portugal', es: 'Día de Portugal' },
  },
  {
    date: '2025-10-05', name: 'Republic Day', country_codes: ['PT'], is_recurring: true,
    translations: { en: 'Republic Day', fr: 'Jour de la République', pt: 'Implantação da República', es: 'Día de la República' },
  },
  {
    date: '2025-12-01', name: 'Restoration of Independence Day', country_codes: ['PT'], is_recurring: true,
    translations: { en: 'Restoration of Independence Day', fr: 'Restauration de l\'Indépendance', pt: 'Restauração da Independência', es: 'Restauración de la Independencia' },
  },
  // Portugal only (moveable)
  {
    date: '2025-04-20', name: 'Easter Sunday', country_codes: ['PT'], is_recurring: false,
    translations: { en: 'Easter Sunday', fr: 'Dimanche de Pâques', pt: 'Domingo de Páscoa', es: 'Domingo de Pascua' },
  },
  {
    date: '2025-06-19', name: 'Corpus Christi', country_codes: ['PT'], is_recurring: false,
    translations: { en: 'Corpus Christi', fr: 'Fête-Dieu', pt: 'Corpo de Deus', es: 'Corpus Christi' },
  },

  // ---- England only (fixed) ----
  {
    date: '2025-12-26', name: 'Boxing Day', country_codes: ['GB'], is_recurring: true,
    translations: { en: 'Boxing Day', fr: 'Lendemain de Noël', pt: 'Dia de São Estêvão', es: 'Día de San Esteban' },
  },
  // England only (moveable)
  {
    date: '2025-05-05', name: 'Early May Bank Holiday', country_codes: ['GB'], is_recurring: false,
    translations: { en: 'Early May Bank Holiday', fr: 'Jour férié de mai', pt: 'Feriado bancário de maio', es: 'Festivo bancario de mayo' },
  },
  {
    date: '2025-05-26', name: 'Spring Bank Holiday', country_codes: ['GB'], is_recurring: false,
    translations: { en: 'Spring Bank Holiday', fr: 'Jour férié de printemps', pt: 'Feriado bancário de primavera', es: 'Festivo bancario de primavera' },
  },
  {
    date: '2025-08-25', name: 'Summer Bank Holiday', country_codes: ['GB'], is_recurring: false,
    translations: { en: 'Summer Bank Holiday', fr: 'Jour férié d\'été', pt: 'Feriado bancário de verão', es: 'Festivo bancario de verano' },
  },

  // ---- Spain only (fixed) ----
  {
    date: '2025-01-06', name: 'Epiphany', country_codes: ['ES'], is_recurring: true,
    translations: { en: 'Epiphany', fr: 'Épiphanie', pt: 'Epifania', es: 'Día de Reyes' },
  },
  {
    date: '2025-10-12', name: 'Hispanic Heritage Day', country_codes: ['ES'], is_recurring: true,
    translations: { en: 'Hispanic Heritage Day', fr: 'Fête nationale espagnole', pt: 'Dia da Hispanidade', es: 'Fiesta Nacional de España' },
  },
  {
    date: '2025-12-06', name: 'Constitution Day', country_codes: ['ES'], is_recurring: true,
    translations: { en: 'Constitution Day', fr: 'Jour de la Constitution', pt: 'Dia da Constituição', es: 'Día de la Constitución' },
  },
  // Spain only (moveable)
  {
    date: '2025-04-17', name: 'Maundy Thursday', country_codes: ['ES'], is_recurring: false,
    translations: { en: 'Maundy Thursday', fr: 'Jeudi Saint', pt: 'Quinta-feira Santa', es: 'Jueves Santo' },
  },
];

// ============================================================
// Seed function
// ============================================================
async function seedHolidays() {
  console.log('Seeding public holidays for FR, PT, GB, ES...');

  let created = 0;
  let existing = 0;
  let translationsCreated = 0;

  for (const h of holidaysData) {
    const dateObj = new Date(h.date + 'T00:00:00.000Z');

    // Check if this exact holiday already exists (same date + name)
    let holiday = await prisma.holidays.findFirst({
      where: {
        date: dateObj,
        name: h.name,
      },
    });

    if (holiday) {
      existing++;
    } else {
      holiday = await prisma.holidays.create({
        data: {
          date: dateObj,
          name: h.name,
          country_codes: h.country_codes,
          is_recurring: h.is_recurring,
          is_active: true,
        },
      });
      created++;
      console.log(`  Created: [${h.country_codes.join(',')}] ${h.date} - ${h.name}${h.is_recurring ? ' (recurring)' : ''}`);
    }

    // Upsert translations for the "name" field
    if (h.translations) {
      for (const [locale, value] of Object.entries(h.translations)) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: ENTITY_TYPE,
              entity_uuid: holiday.uuid,
              field_name: 'name',
              locale,
            },
          },
          update: { value },
          create: {
            entity_type: ENTITY_TYPE,
            entity_uuid: holiday.uuid,
            field_name: 'name',
            locale,
            value,
          },
        });
        translationsCreated++;
      }
    }
  }

  console.log(`Holidays seeding completed! Created ${created}, already existing ${existing}, translations upserted ${translationsCreated}.`);
}

module.exports = { seedHolidays };
