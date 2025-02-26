export default {
  theme: {
    title: 'Thème',
    light: 'Clair',
    dark: 'Sombre'
  },
  language: {
    title: 'Langue',
    fr: 'Français',
    en: 'Anglais',
    pt: 'Portugais',
    es: 'Espagnol'
  },
  nav: {
    myWork: 'Mon Travail',
    create: 'Créer',
    search: 'Rechercher...',
    serviceHub: 'Hub de Services',
    sprintCenter: 'Centre Sprint',
    mail: 'Messagerie',
    portalsBuilder: 'Constructeur de portails',
    data: 'Données',
    tableaux: 'Tableaux',
    configuration: 'Configuration',
    administration: 'Administration'
  },
  serviceHub: {
    title: 'Hub de Services',
    incidents: 'Incidents',
    tickets: 'Tickets'
  },
  sprintCenter: {
    title: 'Centre Sprint',
    tickets: 'Tickets',
    userStories: 'User Stories'
  },
  configuration: {
    title: 'Configuration',
    companies: 'Sociétés',
    locations: 'Localisations',
    sites: 'Sites',
    entities: 'Entités',
    departments: 'Départements',
    persons: 'Personnes',
    supportGroups: 'Groupes de support',
    roles: 'Rôles et permissions',
    ticketStatus: 'Statuts des tickets',
    symptoms: 'Symptômes',
    ticketTypes: 'Types de tickets',
    workflows: 'Workflows',
    import: 'Importer',
    export: 'Exporter',
    refresh: 'Rafraîchir'
  },
  admin: {
    title: 'Administration',
    rolesAndPermissions: 'Rôles et permissions',
    ticketTypes: 'Types de tickets',
    mailServers: 'Serveurs de messagerie',
    emailNotifications: 'Notifications email',
    smsNotifications: 'Notifications SMS',
    authentication: 'Authentification',
    sslCertificates: 'Certificats SSL/TLS',
    mfa: 'MFA',
    ipRestrictions: 'Restrictions IP',
    auditLogs: "Logs d'audit",
    apiTokens: "Tokens d'API et secrets",
    connectors: 'Connecteurs',
    performance: 'Performances de la plateforme',
    backup: 'Sauvegarde et restauration'
  },
  entitiesTable: {
    headers: {
      uuid: 'ID',
      entity_id: 'ID Entité',
      name: 'Nom',
      parent_entity_name: 'Nom Entité Parent',
      external_id: 'ID Externe',
      entity_type: 'Type d\'Entité',
      headquarters_location: 'Localisation du Siège',
      is_active: 'Actif',
      budget_approver_name: 'Approbateur Budget',
      date_creation: 'Date de Création',
      date_modification: 'Date de Modification'
    }
  },
  symptomsTable: {
    headers: {
      id: 'Id',
      createdDate: 'Date de création',
      updateDate: 'Date de modification',
      symptomCode: 'Code symptôme',
      symptomLabel: 'Libellé symptôme',
      symptomLanguage: 'Langue'
    }
  },
  symptoms: {
    createTitle: 'Créer un symptôme',
    updateTitle: 'Modifier le symptôme {code}',
    name: 'Nom du symptôme',
    code: 'Code du symptôme',
    saveSuccess: 'Symptôme enregistré avec succès',
    saveError: 'Erreur lors de l\'enregistrement du symptôme',
    updateSuccess: 'Traductions mises à jour avec succès',
    translationUpdated: 'traduction mise à jour avec succès',
    translationsUpdated: 'traductions mises à jour avec succès',
    noChanges: 'Aucune modification détectée'
  },
  errors: {
    badRequest: 'Requête incorrecte (400)',
    unauthorized: 'Non autorisé (401)',
    forbidden: 'Accès interdit (403)',
    notFound: 'Ressource non trouvée (404)',
    conflict: 'Conflit avec l\'état actuel de la ressource (409)',
    validationError: 'Erreur de validation des données (422)',
    serverError: 'Erreur interne du serveur (500)',
    serviceUnavailable: 'Service temporairement indisponible (503)',
    fetchActiveLanguages: 'Impossible de charger les langues actives',
    fetchSymptomData: 'Impossible de charger les données du symptôme',
    defaultError: 'Une erreur est survenue',
    selectOneRowForUpdate: 'Veuillez sélectionner une ligne à modifier',
    selectRowsForUpdate: 'Veuillez sélectionner au moins une ligne à modifier',
    selectRowsForDelete: 'Veuillez sélectionner au moins une ligne à supprimer',
    noTranslations: 'Veuillez saisir au moins une traduction pour le symptôme'
  },
  common: {
    close: 'Fermer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Modifier',
    import: 'Importer',
    export: 'Exporter',
    refresh: 'Rafraîchir'
  },
  dataPane: {
    title: 'Données',
    applications: {
      title: 'Applications',
      deployed: 'Application Déployée',
      application: 'Application',
      virtualClient: 'Environnement Client Virtuel'
    },
    hardware: {
      title: 'Infrastructure Matérielle',
      hardware: 'Matériel',
      deployedHardware: 'Matériel Déployé',
      workstation: 'Poste de Travail',
      server: 'Serveur',
      storage: 'Périphérique de Stockage de Masse',
      rack: 'Rack',
      ups: 'Onduleur'
    },
    network: {
      title: 'Réseau et Communications',
      firewall: 'Pare-feu',
      switch: 'Commutateur',
      router: 'Routeur',
      routingRule: 'Règle de Routage',
      printer: 'Imprimante',
      zoneCluster: 'Zone Cluster'
    },
    virtualization: {
      title: 'Virtualisation',
      billing: 'Facturation Rack Virtuel',
      farm: 'Ferme'
    },
    database: {
      title: 'Bases de Données',
      catalog: 'Catalogue de Base de Données',
      instance: 'Instance de Base de Données'
    },
    contracts: {
      title: 'Contrats et Licences',
      contract: 'Contrat',
      license: 'Licence Logicielle',
      counter: 'Compteur Logiciel'
    },
    userDevice: {
      title: 'Appareils Utilisateur',
      mobile: 'Mobile',
      laptop: 'Ordinateur Portable',
      printer: 'Imprimante'
    },
    cloud: {
      title: 'Infrastructure Cloud',
      vm: 'Machine Virtuelle',
      service: 'Service Cloud',
      storage: 'Stockage Cloud'
    },
    container: {
      title: 'Conteneurisation',
      container: 'Conteneur'
    },
    security: {
      title: 'Sécurité',
      antivirus: 'Antivirus',
      endpoint: 'Protection des Terminaux'
    }
  },
  nav: {
    myWork: 'Mon Travail',
    create: 'Créer',
    search: 'Rechercher...',
    serviceHub: 'Hub de Services',
    sprintCenter: 'Centre Sprint',
    mail: 'Messagerie',
    portalsBuilder: 'Constructeur de portails',
    data: 'Données',
    tableaux: 'Tableaux',
    configuration: 'Configuration',
    administration: 'Administration'
  }
}
