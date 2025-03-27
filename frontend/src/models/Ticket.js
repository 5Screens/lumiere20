import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'

export class Ticket {
  constructor(data = {}) {
    this.uuid = data.uuid || null;
    this.titre = data.titre || '';
    this.description = data.description || '';
    this.configuration_item_uuid = data.configuration_item_uuid || null;
    this.requested_by_uuid = data.requested_by_uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_type_code = data.ticket_type_code || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.date_creation = data.date_creation || null;
    this.date_modification = data.date_modification || null;
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    const userProfileStore = useUserProfileStore();
    
    return {
      ticket_status_code: {
        label: t('ticket.status'),
        type: 'sSelectField',
        placeholder: t('ticket.status_placeholder'),
        required: true,
        endpoint: `ticket_status?lang=${userProfileStore.language}&toSelect=yes`,
        patchEndpoint: 'tickets',
        fieldName: 'ticket_status_code',
        mode: 'creation'
      },
      titre: {
        editmode: false,
        label: t('ticket.title'),
        type: 'sTextField',
        placeholder: 'Entrez le titre',
        required: true
      },
      description: {
        label: t('ticket.description'),
        type: 'sRichTextEditor',
        placeholder: t('ticket.description_placeholder')
      },
      configuration_item_uuid: {
        label: t('ticket.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.configuration_item_placeholder'),
        endpoint: 'configuration_items',
        displayField: 'nom',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'nom', label: t('configuration_item.nom'), visible: true },
          { key: 'description', label: t('configuration_item.description'), visible: true },
          { key: 'date_creation', label: t('configuration_item.date_creation'), visible: true }
        ],
        required: true
      },
      requested_by_uuid: {
        label: t('ticket.requested_by'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.requested_by_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: true
      },
      requested_for_uuid: {
        label: t('ticket.requested_for'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.requested_for_placeholder'),
        endpoint: 'persons',
        displayField: 'first_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true },
          { key: 'job_role', label: t('person.job_role'), visible: true },
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: true
      }
    }
  }

  toAPI(method) {
    console.log('[Ticket.toAPI] Starting conversion to API format', { method });
    const userProfileStore = useUserProfileStore();
    console.log('[Ticket.toAPI] Current user profile ID:', userProfileStore.id);
    
    // Base object with common fields
    const baseFields = {
      titre: this.titre,
      description: this.description,
      configuration_item_uuid: this.configuration_item_uuid,
      requested_by_uuid: this.requested_by_uuid,
      requested_for_uuid: this.requested_for_uuid,
      writer_uuid: userProfileStore.id, // Always use current user's ID
      ticket_type_code: 'TICKET', //We are creating a ticket
      ticket_status_code: this.ticket_status_code
    };
    console.log('[Ticket.toAPI] Base fields prepared', baseFields);

    switch (method.toUpperCase()) {
      case 'POST':
        console.log('[Ticket.toAPI] Processing POST request - returning all base fields');
        return baseFields;
        
      case 'PUT':
        console.log('[Ticket.toAPI] Processing PUT request - returning all fields with uuid');
        const putData = {
          ...baseFields,
          uuid: this.uuid
        };
        console.log('[Ticket.toAPI] PUT data prepared', putData);
        return putData;
        
      case 'PATCH':
        console.log('[Ticket.toAPI] Processing PATCH request - filtering for modified fields');
        const modifiedFields = {};
        for (const [key, value] of Object.entries(baseFields)) {
          if (value !== null && value !== '') {
            modifiedFields[key] = value;
          }
        }
        const patchData = {
          uuid: this.uuid,
          ...modifiedFields
        };
        console.log('[Ticket.toAPI] PATCH data prepared', patchData);
        return patchData;
        
      default:
        console.error('[Ticket.toAPI] Error: Unsupported HTTP method', { method });
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }
}
