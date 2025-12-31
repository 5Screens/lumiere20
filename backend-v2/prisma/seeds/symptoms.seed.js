const { prisma } = require('../client');

/**
 * Seed symptoms - Common IT symptoms for incident classification
 */
async function seedSymptoms() {
  console.log('Seeding symptoms...');

  const symptoms = [
    { code: 'SLOW_PERFORMANCE', label: 'Slow Performance', is_active: true },
    { code: 'NO_ACCESS', label: 'No Access / Cannot Login', is_active: true },
    { code: 'ERROR_MESSAGE', label: 'Error Message Displayed', is_active: true },
    { code: 'APPLICATION_CRASH', label: 'Application Crash', is_active: true },
    { code: 'DATA_LOSS', label: 'Data Loss / Corruption', is_active: true },
    { code: 'NETWORK_ISSUE', label: 'Network Connectivity Issue', is_active: true },
    { code: 'HARDWARE_FAILURE', label: 'Hardware Failure', is_active: true },
    { code: 'PRINTING_ISSUE', label: 'Printing Issue', is_active: true },
    { code: 'EMAIL_ISSUE', label: 'Email Issue', is_active: true },
    { code: 'SECURITY_ALERT', label: 'Security Alert', is_active: true },
    { code: 'SOFTWARE_INSTALL', label: 'Software Installation Request', is_active: true },
    { code: 'PASSWORD_RESET', label: 'Password Reset Required', is_active: true },
    { code: 'PERMISSION_ISSUE', label: 'Permission / Access Rights Issue', is_active: true },
    { code: 'DISPLAY_ISSUE', label: 'Display / Monitor Issue', is_active: true },
    { code: 'AUDIO_ISSUE', label: 'Audio / Sound Issue', is_active: true },
    { code: 'BACKUP_FAILURE', label: 'Backup Failure', is_active: true },
    { code: 'UPDATE_REQUIRED', label: 'Update / Patch Required', is_active: true },
    { code: 'CONFIGURATION_ERROR', label: 'Configuration Error', is_active: true },
    { code: 'INTEGRATION_ISSUE', label: 'Integration / API Issue', is_active: true },
    { code: 'OTHER', label: 'Other', is_active: true },
  ];

  // Translations for symptoms
  const translations = {
    SLOW_PERFORMANCE: { fr: 'Performance lente', en: 'Slow Performance' },
    NO_ACCESS: { fr: 'Pas d\'accès / Impossible de se connecter', en: 'No Access / Cannot Login' },
    ERROR_MESSAGE: { fr: 'Message d\'erreur affiché', en: 'Error Message Displayed' },
    APPLICATION_CRASH: { fr: 'Crash de l\'application', en: 'Application Crash' },
    DATA_LOSS: { fr: 'Perte / Corruption de données', en: 'Data Loss / Corruption' },
    NETWORK_ISSUE: { fr: 'Problème de connectivité réseau', en: 'Network Connectivity Issue' },
    HARDWARE_FAILURE: { fr: 'Panne matérielle', en: 'Hardware Failure' },
    PRINTING_ISSUE: { fr: 'Problème d\'impression', en: 'Printing Issue' },
    EMAIL_ISSUE: { fr: 'Problème de messagerie', en: 'Email Issue' },
    SECURITY_ALERT: { fr: 'Alerte de sécurité', en: 'Security Alert' },
    SOFTWARE_INSTALL: { fr: 'Demande d\'installation logicielle', en: 'Software Installation Request' },
    PASSWORD_RESET: { fr: 'Réinitialisation de mot de passe requise', en: 'Password Reset Required' },
    PERMISSION_ISSUE: { fr: 'Problème de permissions / droits d\'accès', en: 'Permission / Access Rights Issue' },
    DISPLAY_ISSUE: { fr: 'Problème d\'affichage / moniteur', en: 'Display / Monitor Issue' },
    AUDIO_ISSUE: { fr: 'Problème audio / son', en: 'Audio / Sound Issue' },
    BACKUP_FAILURE: { fr: 'Échec de sauvegarde', en: 'Backup Failure' },
    UPDATE_REQUIRED: { fr: 'Mise à jour / correctif requis', en: 'Update / Patch Required' },
    CONFIGURATION_ERROR: { fr: 'Erreur de configuration', en: 'Configuration Error' },
    INTEGRATION_ISSUE: { fr: 'Problème d\'intégration / API', en: 'Integration / API Issue' },
    OTHER: { fr: 'Autre', en: 'Other' },
  };

  for (const symptom of symptoms) {
    // Upsert symptom
    const created = await prisma.symptoms.upsert({
      where: { code: symptom.code },
      update: { label: symptom.label, is_active: symptom.is_active },
      create: symptom,
    });

    // Upsert translations
    const symptomTranslations = translations[symptom.code];
    if (symptomTranslations) {
      for (const [locale, value] of Object.entries(symptomTranslations)) {
        await prisma.translated_fields.upsert({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: 'symptoms',
              entity_uuid: created.uuid,
              field_name: 'label',
              locale,
            },
          },
          update: { value },
          create: {
            entity_type: 'symptoms',
            entity_uuid: created.uuid,
            field_name: 'label',
            locale,
            value,
          },
        });
      }
    }

    console.log(`  Created/updated symptom: ${symptom.code}`);
  }

  console.log(`Symptoms seeding completed! Created ${symptoms.length} symptoms.`);
}

module.exports = { seedSymptoms };
