import { useUserProfileStore } from '@/stores/userProfileStore'

export class Defect {
  constructor(data = {}) {
    this.uuid = data.uuid || null;
    this.titre = data.titre || '';
    this.description = data.description || '';
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    this.requested_by_uuid = data.requested_by_uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_type_uuid = data.ticket_type_uuid || null;
    this.ticket_status_uuid = data.ticket_status_uuid || null;
    this.date_creation = data.date_creation || null;
    this.date_modification = data.date_modification || null;
    this.severity = data.severity || null;
    this.project = data.project || null;
    this.attachments = data.attachments || [];
    
    // Définition des champs requis avec leurs labels
    this.requiredFields = [
      { name: 'titre', label: 'Titre' },
      { name: 'configuration_item_uuid', label: 'Configuration Item' },
      { name: 'severity', label: 'Sévérité' },
      { name: 'project', label: 'Projet' },
      { name: 'attachments', label: 'Pièces jointes' }
    ];
  }

  static getRenderableFields() {
    return {
      attachments: {
        label: 'Pièces jointes',
        type: 'sFileUploader',
        placeholder: 'Glisser-déposer pour importer',
        helperText: 'LIMITES TAILLE FICHIER | 6 Mo pour les images, 10 Mo pour les autres fichiers',
        required: true,
        edition: false,
        fieldName: 'DEFECT'
      },
      tags: {
        type: 'sTagsList',
        label: 'Tags pour debug !',
        required: true,
        comboBox: true,
        sourceEndPoint: 'change_setup?lang=fr&metadata=validation_level',
        displayedLabel: 'label',
        placeholder: 'Ajouter un tag...',
        helperText: 'Sélectionnez ou saisissez des tags pour catégoriser ce changement',
        edition: false
      }/*,
      uuid: {
        label: 'UUID',
        type: 'sTextField',
        placeholder: 'UUID',
        disabled: true
      },
      titre: {
        label: 'Titre',
        type: 'sTextField',
        placeholder: 'Entrez le titre',
        required: true
      },
      description: {
        label: 'Description',
        type: 'sTextField',
        placeholder: 'Entrez la description',
        multiline: true
      },
      configuration_item_uuid: {
        label: 'Configuration Item',
        type: 'sFilteredSearchField',
        placeholder: 'Sélectionnez un CI',
        table: 'configuration_items',
        required: true
      },
      requested_by_uuid: {
        label: 'Demandé par',
        type: 'sFilteredSearchField',
        placeholder: 'Sélectionnez une personne',
        table: 'persons',
        required: true
      },
      requested_for_uuid: {
        label: 'Demandé pour',
        type: 'sFilteredSearchField',
        placeholder: 'Sélectionnez une personne',
        table: 'persons',
        required: true
      },
      writer_uuid: {
        label: 'Rédacteur',
        type: 'sFilteredSearchField',
        placeholder: 'Sélectionnez une personne',
        table: 'persons',
        required: true
      },
      ticket_type_uuid: {
        label: 'Type de ticket',
        type: 'sSelectField',
        placeholder: 'Sélectionnez un type',
        table: 'ticket_types',
        required: true
      },
      ticket_status_uuid: {
        label: 'Statut',
        type: 'sSelectField',
        placeholder: 'Sélectionnez un statut',
        table: 'ticket_status',
        required: true
      },
      severity: {
        label: 'Sévérité',
        type: 'sSelectField',
        placeholder: 'Sélectionnez une sévérité',
        endpoint: 'defect_setup?lang=fr&metadata=severity',
        required: true
      },
      project: {
        label: 'Projet',
        type: 'sSelectField',
        placeholder: 'Sélectionnez un projet',
        endpoint: 'defect_setup?lang=fr&metadata=project',
        required: true
      }*/
    };
  }
}
