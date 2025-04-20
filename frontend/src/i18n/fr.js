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
  datepicker: {
    today: 'Aujourd\'hui',
    clear: 'Effacer',
    weekdays: {
      su: 'Di',
      mo: 'Lu',
      tu: 'Ma',
      we: 'Me',
      th: 'Je',
      fr: 'Ve',
      sa: 'Sa'
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
    selectOneRow: 'Veuillez sélectionner une valeur',
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
    errorMissingFields: 'Veuillez remplir tous les champs obligatoires',
    showOnlyRequired: 'Afficher uniquement les informations obligatoires'
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
  },
  problem: {
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    title: 'Titre',
    title_placeholder: 'Entrez le titre du problème',
    category: 'Catégorie',
    category_placeholder: 'Sélectionnez une catégorie',
    description: 'Description',
    description_placeholder: 'Décrivez le problème en détail',
    
    configuration_item: 'Élément de configuration',
    configuration_item_placeholder: 'Sélectionnez l\'élément de configuration',
    
    service: 'Service impacté',
    service_placeholder: 'Sélectionnez le service',
    service_offerings: 'Offres de service impactées',
    service_offerings_placeholder: 'Sélectionnez les offres de service',
    
    watch_list: 'Liste de surveillance',
    watch_list_placeholder: 'Ajoutez des observateurs',
    
    impact: 'Impact',
    impact_placeholder: 'Sélectionnez l\'impact',
    urgency: 'Urgence',
    urgency_placeholder: 'Sélectionnez l\'urgence',
    
    assigned_group: 'Équipe en charge',
    assigned_group_placeholder: 'Sélectionnez l\'équipe',
    assigned_to_person: 'Responsable',
    assigned_to_person_placeholder: 'Sélectionnez le responsable',
    
    symptoms_description: 'Symptômes observés',
    symptoms_description_placeholder: 'Décrivez les symptômes observés',
    workaround: 'Solution de contournement',
    workaround_placeholder: 'Décrivez la solution de contournement',
    closed_at: 'Date de clôture',
    closed_at_placeholder: 'Sélectionnez la date de clôture',
    
    knownerrors_list: 'Erreurs connues associées',
    knownerrors_list_placeholder: 'Sélectionnez les erreurs connues',
    changes_list: 'Changements liés',
    changes_list_placeholder: 'Sélectionnez les changements liés',
    incidents_list: 'Incidents liés',
    incidents_list_placeholder: 'Sélectionnez les incidents liés',
    
    root_cause: 'Cause racine',
    root_cause_placeholder: 'Décrivez la cause racine',
    definitive_solution: 'Solution définitive',
    definitive_solution_placeholder: 'Décrivez la solution définitive',
    
    target_resolution_date: 'Date de résolution cible',
    target_resolution_date_placeholder: 'Sélectionnez la date cible',
    actual_resolution_date: 'Date de résolution réelle',
    actual_resolution_date_placeholder: 'Sélectionnez la date réelle',
    actual_resolution_workload: 'Charge de résolution',
    actual_resolution_workload_placeholder: 'Entrez la charge en heures',
    
    closure_justification: 'Justification de la clôture',
    closure_justification_placeholder: 'Entrez la justification de la clôture'
  },
  service: {
    name: 'Nom',
    description: 'Description',
    business_criticality: 'Criticité métier',
    lifecycle_status: 'Statut du cycle de vie',
    version: 'Version',
    operational: 'Impact opérationnel',
    legal_regulatory: 'Impact légal/réglementaire',
    reputational: 'Impact réputationnel',
    financial: 'Impact financier',
    comments: 'Commentaires',
    date_creation: 'Date de création',
    date_modification: 'Date de modification',
    owning_entity_name: 'Entité propriétaire',
    owned_by_name: 'Propriétaire',
    managed_by_name: 'Géré par',
    cab_name: 'CAB',
    parent_service_name: 'Service parent'
  },
  service_offering: {
    name: 'Offre de service',
    description: 'Description',
    start_date: 'Date de début',
    end_date: 'Date de fin',
    business_criticality: 'Criticité métier',
    environment: 'Environnement',
    price_model: 'Modèle de prix',
    currency: 'Devise',
    date_creation: 'Date de création',
    date_modification: 'Date de modification',
    service_name: 'Nom du service parent',
    operator_entity_name: 'Entité opératrice'
  },
  change: {
    // Informations générales
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    requested_for: 'Demandé pour',
    requested_for_placeholder: 'Sélectionnez une personne',
    title: 'Titre',
    title_placeholder: 'Entrez le titre du changement',
    description: 'Description',
    description_placeholder: 'Décrivez le changement en détail',
    configuration_item: 'Élément de configuration',
    configuration_item_placeholder: 'Sélectionnez l\'élément de configuration',
    service: 'Service',
    service_placeholder: 'Sélectionnez le service',
    service_offerings: 'Offres de service',
    service_offerings_placeholder: 'Sélectionnez les offres de service',
    type: 'Type de changement',
    type_placeholder: 'Sélectionnez le type de changement',
    assigned_group: 'Groupe assigné',
    assigned_group_placeholder: 'Sélectionnez le groupe',
    assigned_to_person: 'Assigné à',
    assigned_to_person_placeholder: 'Sélectionnez la personne',
    
    // Évaluation du risque
    risk_q1: 'Question d\'évaluation du risque 1',
    risk_q1_placeholder: 'Sélectionnez une réponse',
    risk_q2: 'Question d\'évaluation du risque 2',
    risk_q2_placeholder: 'Sélectionnez une réponse',
    risk_q3: 'Question d\'évaluation du risque 3',
    risk_q3_placeholder: 'Sélectionnez une réponse',
    risk_q4: 'Question d\'évaluation du risque 4',
    risk_q4_placeholder: 'Sélectionnez une réponse',
    risk_q5: 'Question d\'évaluation du risque 5',
    risk_q5_placeholder: 'Sélectionnez une réponse',
    
    // Évaluation de l'impact
    impact_q1: 'Question d\'évaluation d\'impact 1',
    impact_q1_placeholder: 'Sélectionnez une réponse',
    impact_q2: 'Question d\'évaluation d\'impact 2',
    impact_q2_placeholder: 'Sélectionnez une réponse',
    impact_q3: 'Question d\'évaluation d\'impact 3',
    impact_q3_placeholder: 'Sélectionnez une réponse',
    impact_q4: 'Question d\'évaluation d\'impact 4',
    impact_q4_placeholder: 'Sélectionnez une réponse',
    
    // Planification
    requested_start_date: 'Date de début demandée',
    requested_start_date_placeholder: 'Sélectionnez la date de début demandée',
    requested_end_date: 'Date de fin demandée',
    requested_end_date_placeholder: 'Sélectionnez la date de fin demandée',
    planned_start_date: 'Date de début planifiée',
    planned_start_date_placeholder: 'Sélectionnez la date de début planifiée',
    planned_end_date: 'Date de fin planifiée',
    planned_end_date_placeholder: 'Sélectionnez la date de fin planifiée',
    justification: 'Justification',
    justification_placeholder: 'Sélectionnez la justification',
    objective: 'Objectif',
    objective_placeholder: 'Entrez l\'objectif du changement',
    test_plan: 'Plan de test',
    test_plan_placeholder: 'Décrivez le plan de test',
    implementation_plan: 'Plan de mise en œuvre',
    implementation_plan_placeholder: 'Décrivez le plan de mise en œuvre',
    rollback_plan: 'Plan de retour arrière',
    rollback_plan_placeholder: 'Décrivez le plan de retour arrière',
    post_implementation_plan: 'Plan de suivi post-implémentation',
    post_implementation_plan_placeholder: 'Décrivez le plan de suivi post-implémentation',
    
    // Validation et autorisation
    cab_comments: 'Commentaires CAB',
    cab_comments_placeholder: 'Entrez les commentaires du CAB',
    cab_validation_status: 'Statut de validation CAB',
    cab_validation_status_placeholder: 'Sélectionnez le statut de validation',
    required_validations: 'Validations requises',
    required_validations_placeholder: 'Sélectionnez les niveaux de validation requis',
    validated_at: 'Date de validation',
    validated_at_placeholder: 'Sélectionnez la date de validation',
    
    // Exécution et suivi
    related_tickets: 'Tickets à l\'origine du changement',
    related_tickets_placeholder: 'Sélectionnez le ou les tickets à l\'origine du changement',
    actual_start_date: 'Date de début effective',
    actual_start_date_placeholder: 'Sélectionnez la date de début effective',
    actual_end_date: 'Date de fin effective',
    actual_end_date_placeholder: 'Sélectionnez la date de fin effective',
    elapsed_time: 'Temps écoulé',
    elapsed_time_placeholder: 'Entrez le temps écoulé en heures',
    subscribers: 'Abonnés',
    subscribers_placeholder: 'Sélectionnez les abonnés',
    
    // Clôture et évaluation finale
    success_criteria: 'Critères de succès',
    success_criteria_placeholder: 'Décrivez les critères de succès',
    post_change_evaluation: 'Évaluation post-changement',
    post_change_evaluation_placeholder: 'Sélectionnez l\'évaluation post-changement',
    post_change_comment: 'Commentaire post-changement',
    post_change_comment_placeholder: 'Entrez un commentaire post-changement',
    closed_at: 'Date de clôture',
    closed_at_placeholder: 'Sélectionnez la date de clôture'
  }
}
