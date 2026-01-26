/**
 * Seed file for ticket_types table
 * Contains ticket types with translations
 */

const ticketTypes = [
  { code: 'TASK', label: 'Task', icon: 'pi-check-square' },
  { code: 'INCIDENT', label: 'Incident', icon: 'pi-exclamation-triangle' },
  { code: 'PROBLEM', label: 'Problem', icon: 'pi-search' },
  { code: 'CHANGE', label: 'Change', icon: 'pi-sync' },
  { code: 'SERVICE_REQUEST', label: 'Service Request', icon: 'pi-inbox' },
  { code: 'KNOWLEDGE', label: 'Knowledge Article', icon: 'pi-book' },
  { code: 'USER_STORY', label: 'User Story', icon: 'pi-user' },
  { code: 'SPRINT', label: 'Sprint', icon: 'pi-forward' },
  { code: 'EPIC', label: 'Epic', icon: 'pi-star' },
  { code: 'DEFECT', label: 'Defect', icon: 'pi-bug' },
  { code: 'PROJECT', label: 'Project', icon: 'pi-folder' },
];

// Translations for ticket type labels
const translations = [
  // TASK
  { code: 'TASK', locale: 'fr', value: 'Tâche' },
  { code: 'TASK', locale: 'en', value: 'Task' },
  { code: 'TASK', locale: 'es', value: 'Tarea' },
  { code: 'TASK', locale: 'pt', value: 'Tarefa' },
  { code: 'TASK', locale: 'de', value: 'Aufgabe' },
  { code: 'TASK', locale: 'it', value: 'Attività' },
  // INCIDENT
  { code: 'INCIDENT', locale: 'fr', value: 'Incident' },
  { code: 'INCIDENT', locale: 'en', value: 'Incident' },
  { code: 'INCIDENT', locale: 'es', value: 'Incidente' },
  { code: 'INCIDENT', locale: 'pt', value: 'Incidente' },
  { code: 'INCIDENT', locale: 'de', value: 'Vorfall' },
  { code: 'INCIDENT', locale: 'it', value: 'Incidente' },
  // PROBLEM
  { code: 'PROBLEM', locale: 'fr', value: 'Problème' },
  { code: 'PROBLEM', locale: 'en', value: 'Problem' },
  { code: 'PROBLEM', locale: 'es', value: 'Problema' },
  { code: 'PROBLEM', locale: 'pt', value: 'Problema' },
  { code: 'PROBLEM', locale: 'de', value: 'Problem' },
  { code: 'PROBLEM', locale: 'it', value: 'Problema' },
  // CHANGE
  { code: 'CHANGE', locale: 'fr', value: 'Changement' },
  { code: 'CHANGE', locale: 'en', value: 'Change' },
  { code: 'CHANGE', locale: 'es', value: 'Cambio' },
  { code: 'CHANGE', locale: 'pt', value: 'Mudança' },
  { code: 'CHANGE', locale: 'de', value: 'Änderung' },
  { code: 'CHANGE', locale: 'it', value: 'Cambiamento' },
  // SERVICE_REQUEST
  { code: 'SERVICE_REQUEST', locale: 'fr', value: 'Demande de service' },
  { code: 'SERVICE_REQUEST', locale: 'en', value: 'Service Request' },
  { code: 'SERVICE_REQUEST', locale: 'es', value: 'Solicitud de servicio' },
  { code: 'SERVICE_REQUEST', locale: 'pt', value: 'Solicitação de serviço' },
  { code: 'SERVICE_REQUEST', locale: 'de', value: 'Serviceanfrage' },
  { code: 'SERVICE_REQUEST', locale: 'it', value: 'Richiesta di servizio' },
  // KNOWLEDGE
  { code: 'KNOWLEDGE', locale: 'fr', value: 'Article de connaissance' },
  { code: 'KNOWLEDGE', locale: 'en', value: 'Knowledge Article' },
  { code: 'KNOWLEDGE', locale: 'es', value: 'Artículo de conocimiento' },
  { code: 'KNOWLEDGE', locale: 'pt', value: 'Artigo de conhecimento' },
  { code: 'KNOWLEDGE', locale: 'de', value: 'Wissensartikel' },
  { code: 'KNOWLEDGE', locale: 'it', value: 'Articolo di conoscenza' },
  // USER_STORY
  { code: 'USER_STORY', locale: 'fr', value: 'User Story' },
  { code: 'USER_STORY', locale: 'en', value: 'User Story' },
  { code: 'USER_STORY', locale: 'es', value: 'Historia de usuario' },
  { code: 'USER_STORY', locale: 'pt', value: 'História de usuário' },
  { code: 'USER_STORY', locale: 'de', value: 'User Story' },
  { code: 'USER_STORY', locale: 'it', value: 'User Story' },
  // SPRINT
  { code: 'SPRINT', locale: 'fr', value: 'Sprint' },
  { code: 'SPRINT', locale: 'en', value: 'Sprint' },
  { code: 'SPRINT', locale: 'es', value: 'Sprint' },
  { code: 'SPRINT', locale: 'pt', value: 'Sprint' },
  { code: 'SPRINT', locale: 'de', value: 'Sprint' },
  { code: 'SPRINT', locale: 'it', value: 'Sprint' },
  // EPIC
  { code: 'EPIC', locale: 'fr', value: 'Epic' },
  { code: 'EPIC', locale: 'en', value: 'Epic' },
  { code: 'EPIC', locale: 'es', value: 'Épica' },
  { code: 'EPIC', locale: 'pt', value: 'Épico' },
  { code: 'EPIC', locale: 'de', value: 'Epic' },
  { code: 'EPIC', locale: 'it', value: 'Epic' },
  // DEFECT
  { code: 'DEFECT', locale: 'fr', value: 'Défaut' },
  { code: 'DEFECT', locale: 'en', value: 'Defect' },
  { code: 'DEFECT', locale: 'es', value: 'Defecto' },
  { code: 'DEFECT', locale: 'pt', value: 'Defeito' },
  { code: 'DEFECT', locale: 'de', value: 'Fehler' },
  { code: 'DEFECT', locale: 'it', value: 'Difetto' },
  // PROJECT
  { code: 'PROJECT', locale: 'fr', value: 'Projet' },
  { code: 'PROJECT', locale: 'en', value: 'Project' },
  { code: 'PROJECT', locale: 'es', value: 'Proyecto' },
  { code: 'PROJECT', locale: 'pt', value: 'Projeto' },
  { code: 'PROJECT', locale: 'de', value: 'Projekt' },
  { code: 'PROJECT', locale: 'it', value: 'Progetto' },
];

async function seedTicketTypes(prisma) {
  console.log('Seeding ticket types...');

  // Create a map to store ticket type UUIDs by code
  const ticketTypeUuids = {};

  for (const ticketType of ticketTypes) {
    const result = await prisma.ticket_types.upsert({
      where: { code: ticketType.code },
      update: {
        label: ticketType.label,
        icon: ticketType.icon,
      },
      create: {
        code: ticketType.code,
        label: ticketType.label,
        icon: ticketType.icon,
        is_active: true,
      },
    });
    ticketTypeUuids[ticketType.code] = result.uuid;
    console.log(`  - Ticket type '${ticketType.code}' created/updated`);
  }

  // Upsert translations
  console.log('Seeding ticket type translations...');
  
  for (const translation of translations) {
    const entityUuid = ticketTypeUuids[translation.code];
    if (!entityUuid) {
      console.warn(`  - Ticket type not found for code: ${translation.code}`);
      continue;
    }
    
    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: 'ticket_types',
          entity_uuid: entityUuid,
          field_name: 'label',
          locale: translation.locale,
        },
      },
      update: {
        value: translation.value,
      },
      create: {
        entity_type: 'ticket_types',
        entity_uuid: entityUuid,
        field_name: 'label',
        locale: translation.locale,
        value: translation.value,
      },
    });
  }

  console.log(`Seeded ${translations.length} translations for ticket types`);
  console.log('Ticket types seeding completed!');
}

module.exports = { seedTicketTypes, ticketTypes, translations };
