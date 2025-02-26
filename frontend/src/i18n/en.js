export default {
  theme: {
    title: 'Theme',
    light: 'Light',
    dark: 'Dark'
  },
  language: {
    title: 'Language',
    fr: 'French',
    en: 'English',
    pt: 'Portuguese',
    es: 'Spanish'
  },
  nav: {
    myWork: 'My Work',
    create: 'Create',
    search: 'Search...',
    serviceHub: 'Service Hub',
    sprintCenter: 'Sprint Center',
    mail: 'Mail',
    portalsBuilder: 'Portals Builder',
    data: 'Data',
    tableaux: 'Tables',
    configuration: 'Configuration',
    administration: 'Administration'
  },
  serviceHub: {
    title: 'Service Hub',
    incidents: 'Incidents',
    tickets: 'Tickets'
  },
  configuration: {
    title: 'Configuration',
    companies: 'Companies',
    locations: 'Locations',
    sites: 'Sites',
    entities: 'Entities',
    departments: 'Departments',
    persons: 'Persons',
    supportGroups: 'Support Groups',
    roles: 'Roles and Permissions',
    ticketStatus: 'Ticket Status',
    symptoms: 'Symptoms',
    ticketTypes: 'Ticket Types',
    workflows: 'Workflows',
    import: 'Import',
    export: 'Export',
    refresh: 'Refresh'
  },
  dataPane: {
    title: 'Data',
    applications: {
      title: 'Applications',
      deployed: 'Deployed Application',
      application: 'Application',
      virtualClient: 'Virtual Client Environment'
    },
    hardware: {
      title: 'Hardware Infrastructure',
      hardware: 'Hardware',
      deployedHardware: 'Deployed Hardware',
      workstation: 'Workstation',
      server: 'Server',
      storage: 'Mass Storage Device',
      rack: 'Rack',
      ups: 'UPS'
    },
    network: {
      title: 'Network and Communications',
      firewall: 'Firewall',
      switch: 'Switch',
      router: 'Router',
      routingRule: 'Routing Rule',
      printer: 'Printer',
      zoneCluster: 'Zone Cluster'
    },
    virtualization: {
      title: 'Virtualization',
      billing: 'Virtual Rack Billing',
      farm: 'Farm'
    },
    database: {
      title: 'Databases',
      catalog: 'Database Catalog',
      instance: 'Database Instance'
    },
    contracts: {
      title: 'Contracts and Licenses',
      contract: 'Contract',
      license: 'Software License',
      counter: 'Software Counter'
    },
    userDevice: {
      title: 'User Device',
      mobile: 'Mobile',
      laptop: 'Laptop',
      printer: 'Printer'
    },
    cloud: {
      title: 'Cloud Infrastructure',
      vm: 'Virtual Machine',
      service: 'Cloud Service',
      storage: 'Cloud Storage'
    },
    container: {
      title: 'Containerization',
      container: 'Container'
    },
    security: {
      title: 'Security',
      antivirus: 'Antivirus',
      endpoint: 'Endpoint Protection'
    }
  },
  sprintCenter: {
    title: 'Sprint Center',
    tickets: 'Tickets',
    userStories: 'User Stories'
  },
  admin: {
    title: 'Administration',
    rolesAndPermissions: 'Roles and Permissions',
    ticketTypes: 'Ticket Types',
    mailServers: 'Mail Servers',
    emailNotifications: 'Email Notifications',
    smsNotifications: 'SMS Notifications',
    authentication: 'Authentication',
    sslCertificates: 'SSL/TLS Certificates',
    mfa: 'MFA',
    ipRestrictions: 'IP Restrictions',
    auditLogs: 'Audit Logs',
    apiTokens: 'API Tokens and Secrets',
    connectors: 'Connectors',
    performance: 'Platform Performance',
    backup: 'Backup and Restore'
  },
  common: {
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    export: 'Export',
    refresh: 'Refresh'
  },
  nav: {
    myWork: 'My Work',
    create: 'Create',
    search: 'Search...',
    serviceHub: 'Service Hub',
    sprintCenter: 'Sprint Center',
    mail: 'Mail',
    portalsBuilder: 'Portals Builder',
    data: 'Data',
    tableaux: 'Tables',
    configuration: 'Configuration',
    administration: 'Administration'
  },
  entitiesTable: {
    headers: {
      uuid: 'ID',
      entity_id: 'Entity ID',
      name: 'Name',
      parent_entity_name: 'Parent Entity Name',
      external_id: 'External ID',
      entity_type: 'Entity Type',
      headquarters_location: 'Headquarters Location',
      is_active: 'Active',
      budget_approver_name: 'Budget Approver',
      date_creation: 'Creation Date',
      date_modification: 'Modification Date'
    }
  },
  symptomsTable: {
    headers: {
      id: 'Id',
      createdDate: 'Created Date',
      updateDate: 'Update Date',
      symptomCode: 'Symptom Code',
      symptomLabel: 'Symptom Label',
      symptomLanguage: 'Language'
    }
  },
  symptoms: {
    createTitle: 'Create Symptom',
    updateTitle: 'Update Symptom {code}',
    name: 'Symptom Name',
    code: 'Symptom Code',
    saveSuccess: 'Symptom saved successfully',
    saveError: 'Error saving symptom',
    updateSuccess: 'Translations updated successfully',
    translationUpdated: 'translation updated successfully',
    translationsUpdated: 'translations updated successfully',
    noChanges: 'No changes detected'
  },
  errors: {
    badRequest: 'Bad Request (400)',
    unauthorized: 'Unauthorized (401)',
    forbidden: 'Forbidden (403)',
    notFound: 'Resource not found (404)',
    conflict: 'Conflict with current state of the resource (409)',
    validationError: 'Data validation error (422)',
    serverError: 'Internal server error (500)',
    serviceUnavailable: 'Service temporarily unavailable (503)',
    fetchActiveLanguages: 'Unable to load active languages',
    fetchSymptomData: 'Unable to load symptom data',
    defaultError: 'An error occurred',
    noTranslations: 'Please enter at least one translation for the symptom'
  }
}
