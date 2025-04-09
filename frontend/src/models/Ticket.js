import i18n from '@/i18n'
import { useUserProfileStore } from '../stores/userProfileStore'
import { useObjectStore } from '../stores/objectStore'

export class Ticket {
  constructor(data = {}) {
    this.uuid = data.uuid || null;
    this.titre = data.titre || '';
    this.description = data.description || '';
    this.requested_by_uuid = data.requested_by_uuid || null;
    this.requested_for_uuid = data.requested_for_uuid || null;
    this.assigned_to_group = data.assigned_to_group || null;
    this.assigned_to_person = data.assigned_to_person || null;
    this.writer_uuid = data.writer_uuid || null;
    this.ticket_type_code = data.ticket_type_code || null;
    this.ticket_status_code = data.ticket_status_code || null;
    this.date_creation = data.date_creation || null;
    this.date_modification = data.date_modification || null;
    this.watch_list = data.watch_list || [];
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
          { key: 'email', label: t('person.email'), visible: true }
        ],
        required: true
      },
      assigned_to_group: {
        label: t('ticket.assigned_team_label'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.assigned_team_placeholder'),
        endpoint: () => {
          // Utiliser le store pour accéder à la valeur de la personne assignée
          const objectStore = useObjectStore();
          const assigned_to_person = objectStore.currentObject?.assigned_to_person;
          
          console.log('[Ticket.assigned_to_group.endpoint] Using assigned_to_person:', assigned_to_person);
          return assigned_to_person 
            ? `persons/${assigned_to_person}/groups` 
            : 'groups';
        },
        displayField: 'groupe_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'groupe_name', label: t('group.name'), visible: true },
          { key: 'phone', label: t('group.phone'), visible: true }
        ],
        required: false
      },
      assigned_to_person: {
        label: t('ticket.assigned_to_label'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.assigned_to_placeholder'),
        endpoint: () => {
          // Utiliser le store pour accéder à la valeur du groupe
          const objectStore = useObjectStore();
          const assigned_to_group = objectStore.currentObject?.assigned_to_group;
          
          console.log('[Ticket.assigned_to_person.endpoint] Using assigned_to_group:', assigned_to_group);
          return assigned_to_group 
            ? `groups/${assigned_to_group}/members` 
            : `groups/members`;
        },
        displayField: 'first_name',
        valueField: 'uuid',
        editMode: false,
        columnsConfig: [
          { key: 'first_name', label: t('person.first_name'), visible: true },
          { key: 'last_name', label: t('person.last_name'), visible: true }
        ],
        required: false
      },
      watch_list: {
        label: t('ticket.watcher'),
        type: "sPickList",
        helperText: t('ticket.watcher_helper_text'),
        placeholder: t('ticket.watcher_placeholder'),
        required: false,
        edition: false,
        sourceEndPoint: "persons",
        displayedLabel: "first_name",
        targetEndPoint: "tickets",
        target_uuid: null,
        pickedItems: null
      }
    }
  }

  toAPI(method) {
    console.log('[Ticket.toAPI] Starting conversion to API format', { method });
    const userProfileStore = useUserProfileStore();
    const objectStore = useObjectStore();
    
    console.log('[Ticket.toAPI] Current user profile ID:', userProfileStore.id);
    
    // Détermine si nous devons utiliser l'objet du store ou l'instance actuelle
    const sourceObject = (objectStore.currentObject && objectStore.currentObjectType === 'TICKET') 
      ? objectStore.currentObject 
      : this;
    
    console.log('[Ticket.toAPI] Using source object:', sourceObject === objectStore.currentObject ? 'from store' : 'from instance');
    
    // Base object with common fields
    const baseFields = {
      titre: sourceObject.titre,
      description: sourceObject.description,
      requested_by_uuid: sourceObject.requested_by_uuid,
      requested_for_uuid: sourceObject.requested_for_uuid,
      assigned_to_group: sourceObject.assigned_to_group,
      assigned_to_person: sourceObject.assigned_to_person,
      writer_uuid: userProfileStore.id, // Always use current user's ID
      ticket_type_code: 'TICKET', //We are creating a ticket
      ticket_status_code: sourceObject.ticket_status_code,
      watch_list: sourceObject.watch_list
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
          uuid: sourceObject.uuid
        };
        return putData;
        
      case 'PATCH':
        console.log('[Ticket.toAPI] Processing PATCH request - returning minimal data');
        // For PATCH, we typically only return the specific field being updated
        // This is handled by the caller (usually objectStore.patchObject)
        return baseFields;
        
      default:
        console.log('[Ticket.toAPI] Unknown method, defaulting to base fields');
        return baseFields;
    }
  }

  static fromAPI(apiData) {
    console.log('[Ticket.fromAPI] Converting API data to Ticket instance', apiData);
    const ticket = new Ticket(apiData);
    
    // Mettre à jour le store si nécessaire
    const objectStore = useObjectStore();
    if (objectStore.currentObjectType === 'TICKET' && objectStore.currentObject) {
      console.log('[Ticket.fromAPI] Updating current object in store');
      objectStore.currentObject = ticket;
    }
    
    return ticket;
  }
}
