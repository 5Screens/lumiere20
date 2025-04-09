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
  entities: {
    name: 'Nom de l\'entité',
    entity_id: 'ID Entité',
    external_id: 'ID Externe',
    entity_type: 'Type d\'Entité',
    is_active: 'Actif',
    location:"Localisation du siège",
    parent: "Entité parente",
    saveSuccess: 'Entité enregistrée avec succès',
    saveError: 'Erreur lors de l\'enregistrement de l\'entité',
    updateSuccess: 'Entité mise à jour avec succès',
    createTitle: 'Nouvelle entité',
    updateTitle: 'Modifier l\'entité'
  },
  errors: {
    identificationLabel: 'Erreur',
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
    noTranslations: 'Veuillez saisir au moins une traduction pour le symptôme',
    requiredFields: 'Veuillez saisir tous les champs obligatoires', 
    selectOneRow: 'Veuillez sélectionner une option',
    requiredField: 'Champ obligatoire'
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
    refresh: 'Rafraîchir',
    loading: 'Chargement...',
    selectOption: 'Sélectionner une option',
    loading_in_progress: 'Chargement en cours',
    confirm_edit: 'Confirmer la modification',
    cancel_edit: 'Annuler la modification',
    yes: 'Oui',
    no: 'Non',
    createLabel: 'Que souhaitez-vous créer ?'
  },
  notifications: {
    title: 'Notification',
    message: 'Message du système',
    creationSuccess: 'Création réussie',
    creationError: 'Erreur lors de la création',
    updateSuccess: 'Mise à jour réussie',
    updateError: 'Erreur lors de la mise à jour',
    deleteSuccess: 'Suppression réussie',
    deleteError: 'Erreur lors de la suppression',
    loadingError: 'Erreur lors du chargement'
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
  },
  audit: {
    eventType: 'Type d\'événement',
    objectType: 'Type d\'objet',
    oldValue: 'Ancienne valeur',
    newValue: 'Nouvelle valeur',
    user: 'Utilisateur',
    time: 'Temps',
    totalChanges: 'Total des modifications',
    noData: 'Aucune donnée d\'audit disponible',
    timeAgo: {
      justNow: 'à l\'instant',
      seconds: 'il y a quelques secondes',
      minute: 'il y a 1 minute',
      minutes: 'il y a {count} minutes',
      hour: 'il y a 1 heure',
      hours: 'il y a {count} heures',
      day: 'il y a 1 jour',
      days: 'il y a {count} jours',
      month: 'il y a 1 mois',
      months: 'il y a {count} mois',
      year: 'il y a 1 an',
      years: 'il y a {count} ans'
    }
  },
  objectEditView: {
    title: 'Créer',
    save: 'Enregistrer',
    errorMissingFields: 'Veuillez remplir tous les champs obligatoires'
  },
  ticket: {
    title: 'Titre',
    description: 'Description',
    description_placeholder: 'Entrez la description',
    configuration_item: 'Configuration Item',
    configuration_item_placeholder: 'Sélectionnez un CI',
    requested_by: 'Demandé par',
    requested_by_placeholder: 'Sélectionnez une personne',
    requested_for: 'Demandé pour',
    requested_for_placeholder: 'Sélectionnez une personne',
    writer: 'Rédacteur',
    writer_placeholder: 'Sélectionnez une personne',
    type: 'Type de ticket',
    type_placeholder: 'Sélectionnez un type',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    watcher: 'Observateur(s)',
    watcher_placeholder: 'Sélectionnez une ou plusieurs personnes',
    watcher_helper_text: 'Choisissez qui est intéressé par le traitement du ticket',
    assigned_team_label: 'Equipe assignée',
    assigned_team_placeholder: 'Sélectionnez une équipe',
    assigned_to_label: 'Assigné à',
    assigned_to_placeholder: 'Sélectionnez une personne'
  },
  configuration_item: {
    date_creation: 'Date de Création',
    nom: 'Nom',
    description: 'Description'
  },
  person: {
    first_name: 'Prénom',
    last_name: 'Nom',
    job_role: 'Rôle',
    email: 'Email',
    phone: 'Téléphone'
  },
  group: {
    name: 'Nom du groupe',
    phone: 'Téléphone'
  },
  incident: {
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    title: 'Titre',
    title_placeholder: 'Entrez le titre de l\'incident',
    description: 'Description',
    description_placeholder: 'Décrivez l\'incident en détail',
    
    requested_by: 'Demandé par',
    requested_by_placeholder: 'Sélectionnez le demandeur',
    requested_for: 'Demandé pour',
    requested_for_placeholder: 'Sélectionnez le destinataire',
    
    configuration_item: 'Élément de configuration',
    configuration_item_placeholder: 'Sélectionnez l\'élément de configuration',
    
    assigned_group: 'Groupe assigné',
    assigned_group_placeholder: 'Sélectionnez le groupe',
    assigned_to: 'Assigné à',
    assigned_to_placeholder: 'Sélectionnez la personne',
    watch_list: 'Liste de surveillance',
    watch_list_placeholder: 'Ajoutez des observateurs',
    
    impact: 'Impact',
    impact_placeholder: 'Sélectionnez l\'impact',
    urgency: 'Urgence',
    urgency_placeholder: 'Sélectionnez l\'urgence',
    priority: 'Priorité',
    priority_placeholder: 'Priorité calculée',
    
    service: 'Service impacté',
    service_placeholder: 'Sélectionnez le service',
    service_offerings: 'Offres de service impactées',
    service_offerings_placeholder: 'Sélectionnez les offres de service',
    
    contact_type: 'Type de contact',
    contact_type_placeholder: 'Sélectionnez le type de contact',
    resolution_notes: 'Notes de résolution',
    resolution_notes_placeholder: 'Entrez les notes de résolution',
    resolution_code: 'Code de résolution',
    resolution_code_placeholder: 'Sélectionnez le code de résolution',
    cause_code: 'Code de cause',
    cause_code_placeholder: 'Sélectionnez le code de cause',
    
    problem_id: 'Problème associé',
    problem_id_placeholder: 'Sélectionnez le problème',
    change_request: 'Demande de changement',
    change_request_placeholder: 'Sélectionnez la demande de changement'
  }
}
