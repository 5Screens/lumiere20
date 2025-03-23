import i18n from '@/i18n'

export class Ticket {
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
  }

  static getRenderableFields() {
    const { t } = i18n.global;
    
    return {
      titre: {
        editmode: false,
        label: t('ticket.title'),
        type: 'sTextField',
        placeholder: 'Entrez le titre',
        required: true
      },
      description: {
        label: t('ticket.description'),
        type: 'sTextField',
        placeholder: t('ticket.description_placeholder'),
        multiline: true
      },
      configuration_item_uuid: {
        label: t('ticket.configuration_item'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.configuration_item_placeholder'),
        table: 'configuration_items',
        required: true
      },
      requested_by_uuid: {
        label: t('ticket.requested_by'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.requested_by_placeholder'),
        table: 'persons',
        required: true
      },
      requested_for_uuid: {
        label: t('ticket.requested_for'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.requested_for_placeholder'),
        table: 'persons',
        required: true
      },
      writer_uuid: {
        label: t('ticket.writer'),
        type: 'sFilteredSearchField',
        placeholder: t('ticket.writer_placeholder'),
        table: 'persons',
        required: true
      },
      ticket_status_uuid: {
        label: t('ticket.status'),
        type: 'sSelectField',
        placeholder: t('ticket.status_placeholder'),
        table: 'ticket_status',
        required: true
      }
    };
  }
}
