const { prisma } = require('../client');

/**
 * Seed translations for ticket type fields
 * Adds French translations for all ticket type field labels
 */
async function seedTicketTypeFieldsTranslations() {
  console.log('Seeding ticket type fields translations...');

  // Get all ticket type fields
  const fields = await prisma.ticket_type_fields.findMany({
    select: { uuid: true, field_name: true, label: true }
  });

  console.log(`  Found ${fields.length} ticket type fields`);

  // French translations for field labels
  const frenchTranslations = {
    // TASK fields
    'initial_target_date': 'Date cible initiale',
    'revised_target_date': 'Date cible révisée',
    'postponement_count': 'Nombre de reports',
    
    // INCIDENT fields
    'symptoms_uuid': 'Symptômes',
    'impact': 'Impact',
    'urgency': 'Urgence',
    'priority': 'Priorité',
    'contact_type': 'Type de contact',
    'service_uuid': 'Service',
    'service_offerings_uuid': 'Offres de service',
    'resolution_notes': 'Notes de résolution',
    'resolution_code': 'Code de résolution',
    'cause_code': 'Code de cause',
    'problem_uuid': 'Problème lié',
    'change_uuid': 'Demande de changement liée',
    'sla_assignation_due_at': 'Échéance SLA assignation',
    'assigned_to_at': 'Assigné le',
    'sla_resolution_due_at': 'Échéance SLA résolution',
    'resolved_at': 'Résolu le',
    'reopen_count': 'Nombre de réouvertures',
    'assignment_count': 'Nombre d\'assignations',
    'assignment_to_count': 'Nombre d\'assignations à',
    'standby_count': 'Nombre de mises en attente',
    
    // PROBLEM fields
    'rel_problem_categories_code': 'Catégorie de problème',
    'symptoms_description': 'Description des symptômes',
    'workaround': 'Solution de contournement',
    'root_cause': 'Cause racine',
    'definitive_solution': 'Solution définitive',
    'target_resolution_date': 'Date de résolution cible',
    'actual_resolution_date': 'Date de résolution réelle',
    'actual_resolution_workload': 'Charge de travail réelle',
    'closure_justification': 'Justification de clôture',
    
    // PROJECT fields
    'key': 'Clé du projet',
    'start_date': 'Date de début',
    'end_date': 'Date de fin',
    'visibility': 'Visibilité',
    'project_type': 'Type de projet',
    'access_to_groups': 'Groupes autorisés',
    'access_to_users': 'Utilisateurs autorisés',
    
    // CHANGE fields
    'rel_change_type_code': 'Type de changement',
    'r_q1': 'Question risque 1',
    'r_q2': 'Question risque 2',
    'r_q3': 'Question risque 3',
    'r_q4': 'Question risque 4',
    'r_q5': 'Question risque 5',
    'i_q1': 'Question impact 1',
    'i_q2': 'Question impact 2',
    'i_q3': 'Question impact 3',
    'i_q4': 'Question impact 4',
    'requested_start_date_at': 'Date de début demandée',
    'requested_end_date_at': 'Date de fin demandée',
    'planned_start_date_at': 'Date de début planifiée',
    'planned_end_date_at': 'Date de fin planifiée',
    'rel_change_justifications_code': 'Justification',
    'rel_change_objective': 'Objectif',
    'test_plan': 'Plan de test',
    'implementation_plan': 'Plan d\'implémentation',
    'rollback_plan': 'Plan de retour arrière',
    'post_implementation_plan': 'Plan post-implémentation',
    'rel_required_validations': 'Validations requises',
    'cab_comments': 'Commentaires CAB',
    'rel_cab_validation_status': 'Statut validation CAB',
    'validated_at': 'Validé le',
    'actual_start_date_at': 'Date de début réelle',
    'actual_end_date_at': 'Date de fin réelle',
    'elapsed_time': 'Temps écoulé',
    'success_criteria': 'Critères de succès',
    'post_change_evaluation': 'Évaluation post-changement',
    'post_change_comment': 'Commentaire post-changement',
    
    // KNOWLEDGE fields
    'rel_category': 'Catégorie',
    'summary': 'Résumé',
    'keywords': 'Mots-clés',
    'prerequisites': 'Prérequis',
    'limitations': 'Limitations',
    'security_notes': 'Notes de sécurité',
    'rel_involved_process': 'Processus concerné',
    'rel_target_audience': 'Public cible',
    'business_scope': 'Périmètre métier',
    'rel_lang': 'Langue',
    'rel_confidentiality_level': 'Niveau de confidentialité',
    'version': 'Version',
    'last_review_at': 'Dernière révision',
    'next_review_at': 'Prochaine révision',
    'license_type': 'Type de licence',
    
    // SERVICE_REQUEST fields
    'rel_request_type': 'Type de demande',
    'expected_delivery_at': 'Livraison attendue',
    'actual_delivery_at': 'Livraison réelle',
    'quantity': 'Quantité',
    'unit_cost': 'Coût unitaire',
    'total_cost': 'Coût total',
    'approval_status': 'Statut d\'approbation',
    'approved_at': 'Approuvé le',
    'approved_by_uuid': 'Approuvé par',
    'fulfillment_notes': 'Notes de traitement',
    
    // EPIC fields
    'project_uuid': 'Projet',
    'acceptance_criteria': 'Critères d\'acceptation',
    'business_value': 'Valeur métier',
    'target_release': 'Version cible',
    
    // SPRINT fields
    'sprint_goal': 'Objectif du sprint',
    'sprint_number': 'Numéro de sprint',
    'velocity': 'Vélocité',
    'capacity': 'Capacité',
    
    // USER_STORY fields
    'story_points': 'Points de story',
    'epic_uuid': 'Epic',
    'sprint_uuid': 'Sprint',
    
    // BUG fields
    'severity': 'Sévérité',
    'environment': 'Environnement',
    'browser': 'Navigateur',
    'operating_system': 'Système d\'exploitation',
    'steps_to_reproduce': 'Étapes de reproduction',
    'expected_behavior': 'Comportement attendu',
    'tags': 'Tags',
  };

  const ENTITY_TYPE = 'ticket_type_fields';
  let createdCount = 0;
  let updatedCount = 0;

  for (const field of fields) {
    const frLabel = frenchTranslations[field.field_name];
    
    // Always create/update English translation (from the label field)
    await prisma.translated_fields.upsert({
      where: {
        entity_type_entity_uuid_field_name_locale: {
          entity_type: ENTITY_TYPE,
          entity_uuid: field.uuid,
          field_name: 'label',
          locale: 'en'
        }
      },
      update: { value: field.label },
      create: {
        entity_type: ENTITY_TYPE,
        entity_uuid: field.uuid,
        field_name: 'label',
        locale: 'en',
        value: field.label
      }
    });

    // Create/update French translation if available
    if (frLabel) {
      const existing = await prisma.translated_fields.findUnique({
        where: {
          entity_type_entity_uuid_field_name_locale: {
            entity_type: ENTITY_TYPE,
            entity_uuid: field.uuid,
            field_name: 'label',
            locale: 'fr'
          }
        }
      });

      if (existing) {
        await prisma.translated_fields.update({
          where: {
            entity_type_entity_uuid_field_name_locale: {
              entity_type: ENTITY_TYPE,
              entity_uuid: field.uuid,
              field_name: 'label',
              locale: 'fr'
            }
          },
          data: { value: frLabel }
        });
        updatedCount++;
      } else {
        await prisma.translated_fields.create({
          data: {
            entity_type: ENTITY_TYPE,
            entity_uuid: field.uuid,
            field_name: 'label',
            locale: 'fr',
            value: frLabel
          }
        });
        createdCount++;
      }
    } else {
      console.log(`    No French translation for field: ${field.field_name}`);
    }
  }

  console.log(`  Created ${createdCount} French translations`);
  console.log(`  Updated ${updatedCount} French translations`);
  console.log('Ticket type fields translations seeding completed!');
}

module.exports = { seedTicketTypeFieldsTranslations };
