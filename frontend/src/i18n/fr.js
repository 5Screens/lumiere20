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
    tasks: 'Tâches',
    problems: 'Problèmes',
    changes: 'Changements',
    releases: 'Mise en production',
    knowledge: 'Connaissances',
  },
  
  // Section pour le composant objectCreationsAndUpdates
  objectCreationsAndUpdates: {
    // Titres pour les incidents
    incidentCreation: 'Créer un incident',
    incidentUpdate: 'Modifier l\'incident',
    
    // Titres pour les symptômes
    symptomCreation: 'Créer un symptôme',
    symptomUpdate: 'Modifier le symptôme',
    
    // Titres pour les entités
    entityCreation: 'Créer une entité',
    entityUpdate: 'Modifier l\'entité',
    
    // Titres pour les tâches
    ticketCreation: 'Créer une tâche',
    ticketUpdate: 'Modifier la tâche',
    
    // Titres pour les problèmes
    problemCreation: 'Créer un problème',
    problemUpdate: 'Modifier le problème',
    
    // Titres pour les changements
    changeCreation: 'Créer un changement',
    changeUpdate: 'Modifier le changement',
    
    // Titres pour les articles de connaissance
    knowledgeCreation: 'Créer un article de connaissance',
    knowledgeUpdate: 'Modifier l\'article de connaissance',
    
    // Titres pour les projets
    projectCreation: 'Créer un projet',
    projectUpdate: 'Modifier le projet',
    
    // Titres pour les sprints
    sprintCreation: 'Créer un sprint',
    sprintUpdate: 'Modifier le sprint',
    
    // Titres pour les épopées
    epicCreation: 'Créer une épopée',
    epicUpdate: 'Modifier l\'épopée',
    
    // Titres pour les histoires
    storyCreation: 'Créer une histoire',
    storyUpdate: 'Modifier l\'histoire',
    
    // Titres pour les défauts
    defectCreation: 'Créer un défaut',
    defectUpdate: 'Modifier le défaut'
  },
  sprintCenter: {
    title: 'Centre Sprint',
    tasks: 'Tâches',
    userStories: 'User Stories',
    sprints: 'Sprints',
    defects: 'Bugs',
    epics: 'Épics',
    projects: 'Projets',
    bugs: 'Bugs'
  },
  underConstruction: {
    title: 'En cours de construction'
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
    ticketTypes: 'Types de tâches',
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
    budget_approver_name: 'Approbateur Budget',
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
    id: 'Identifiant',
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
    createLabel: 'Que souhaitez-vous créer ?',
    creation_date: 'Créé le',
    modification_date: 'Modifié le', 
    closure_date: 'Fermé le'
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
    showOnlyRequired: 'Afficher uniquement les informations obligatoires',
    creationSuccess: 'Création réussie',
    creationError: 'Erreur lors de la création'
  },
  task: {
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
    type: 'Type de tâche',
    type_placeholder: 'Sélectionnez un type',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    watcher: 'Observateur(s)',
    watcher_placeholder: 'Sélectionnez une ou plusieurs personnes',
    watcher_helper_text: 'Choisissez qui est intéressé par le traitement de la tâche',
    assigned_team_label: 'Equipe assignée',
    assigned_team_placeholder: 'Sélectionnez une équipe',
    assigned_to_label: 'Assigné à',
    assigned_to_placeholder: 'Sélectionnez une personne'
  },
  configuration_item: {
    created_at: 'Date de Création',
    name: 'Nom',
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
    change_request: 'Changement à l\'origine de l\'incident',
    change_request_placeholder: 'Sélectionnez la demande de changement',
    reopen_count:'Nb. de réouverture',
    standby_count:'Nb. de mise en attente',
    assignment_count:'Nb. de transfert d\'équipe',
    assignment_to_count:'Nb. d\'assignations à une personne',
    
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
    created_at: 'Date de création',
    updated_at: 'Date de modification',
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
    created_at: 'Date de création',
    updated_at: 'Date de modification',
    service_name: 'Nom du service parent',
    operator_entity_name: 'Entité opératrice'
  },
  change: {
    // Informations générales
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    requested_for: 'Demandé pour',
    requested_for_placeholder: 'Sélectionnez une personne',
    writer: 'Rédacteur',
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
    watch_list:'Observateurs du changement',
    watch_list_placeholder:'Ajoutez des observateurs',
    
    
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
  },

  epic: {
    // Informations générales
    name: 'Nom de l\'épopée',
    name_placeholder: 'Entrez le nom de l\'épopée',
    description: 'Description',
    description_placeholder: 'Entrez une description détaillée de l\'épopée',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    
    // Attributs étendus
    project_id: 'Projet parent',
    project_id_placeholder: 'Sélectionnez le projet parent',
    start_date: 'Date de début',
    start_date_placeholder: 'Sélectionnez la date de début',
    end_date: 'Date de fin',
    end_date_placeholder: 'Sélectionnez la date de fin',
    progress_percent: 'Pourcentage d\'avancement',
    progress_percent_placeholder: 'Entrez le pourcentage d\'avancement (0-100)',
    color: 'Couleur',
    color_placeholder: 'Entrez un code couleur (ex: #FF5733)',
    tags: 'Tags',
    tags_placeholder: 'Ajoutez des tags pour catégoriser l\'épopée',
    
    // Timestamps
    created_at: 'Date de création',
    created_at_placeholder: 'Date de création automatique',
    updated_at: 'Date de mise à jour',
    updated_at_placeholder: 'Date de mise à jour automatique',
    closed_at: 'Date de clôture',
    closed_at_placeholder: 'Date de clôture automatique',

    //Compteurs
    stories_count: 'Nombre de stories',
    tasks_count: 'Nombre de tâches',
  },

  story: {
    // Informations générales
    title: 'Titre de la story',
    title_placeholder: 'Entrez le titre de la story utilisateur',
    description: 'Description',
    description_placeholder: 'Entrez une description détaillée de la story utilisateur',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    
    // Informations sur les personnes
    writer: 'Rédacteur',
    writer_placeholder: 'Personne qui saisit la story dans le système',
    reporter: 'Demandeur',
    reporter_placeholder: 'Sélectionnez la personne responsable de l\'expression de la valeur',
    
    // Attributs étendus
    project_id: 'Projet parent',
    project_id_placeholder: 'Sélectionnez le projet parent',
    team: 'Équipe',
    team_placeholder: 'Sélectionnez l\'équipe en charge de la story',
    team_placeholder_if_empty_project: 'Veuillez d\'abord sélectionner un projet',
    assignee: 'Assigné à',
    assignee_placeholder: 'Sélectionnez la personne chargée de réaliser techniquement la story',
    assignee_placeholder_if_empty_team: 'Veuillez d\'abord sélectionner une équipe',
    epic_id: 'Épopée',
    epic_id_placeholder: 'Sélectionnez l\'épopée associée',
    sprint_id: 'Sprint',
    sprint_id_placeholder: 'Sélectionnez le sprint associé',
    story_points: 'Points de story',
    story_points_placeholder: 'Entrez le nombre de points de story',
    priority: 'Priorité',
    priority_placeholder: 'Entrez la priorité de la story',
    acceptance_criteria: 'Critères d\'acceptation',
    acceptance_criteria_placeholder: 'Entrez les critères d\'acceptation de la story',
    tags: 'Tags',
    tags_placeholder: 'Ajoutez des tags pour catégoriser la story',
    
    // Timestamps
    created_at: 'Date de création',
    created_at_placeholder: 'Date de création automatique',
    updated_at: 'Date de mise à jour',
    updated_at_placeholder: 'Date de mise à jour automatique'
  },

  knowledge_article: {
    // Métadonnées d'identification et de classification
    category: 'Catégorie',
    category_placeholder: 'Sélectionnez une catégorie',
    keywords: 'Mots-clés',
    keywords_placeholder: 'Entrez des mots-clés',
    service: 'Service',
    service_placeholder: 'Sélectionnez un service',
    service_offerings: 'Offres de service',
    service_offerings_placeholder: 'Sélectionnez des offres de service',
    target_audience: 'Public cible',
    target_audience_placeholder: 'Sélectionnez le public cible',
    lang: 'Langue',
    lang_placeholder: 'Sélectionnez une langue',
    confidentiality_level: 'Niveau de confidentialité',
    confidentiality_level_placeholder: 'Sélectionnez un niveau de confidentialité',
    
    // Contenu et structure de l'article
    title: 'Titre',
    title_placeholder: 'Entrez le titre de l\'article',
    summary: 'Résumé',
    summary_placeholder: 'Entrez un résumé de l\'article',
    description: 'Contenu détaillé',
    description_placeholder: 'Entrez le contenu détaillé de l\'article',
    prerequisites: 'Pré-requis',
    prerequisites_placeholder: 'Entrez les pré-requis nécessaires',
    limitations: 'Limitations connues',
    limitations_placeholder: 'Décrivez les limitations connues',
    security_notes: 'Notes de sécurité',
    security_notes_placeholder: 'Entrez les notes de sécurité importantes',
    attachments: 'Pièces jointes',
    attachments_placeholder: 'Ajoutez des pièces jointes',
    writer: 'Rédacteur',
    
    // Contexte opérationnel et liens
    configuration_item: 'Composant concerné',
    configuration_item_placeholder: 'Sélectionnez un composant',
    ticket_type: 'Processus associé',
    ticket_type_placeholder: 'Sélectionnez un processus',
    tickets_list: 'Tickets reliés',
    tickets_list_placeholder: 'Sélectionnez des tickets reliés',
    business_scope: 'Périmètre métier',
    business_scope_placeholder: 'Définissez le périmètre métier',
    
    // Gouvernance et cycle de vie
    publication_status: 'État de publication',
    publication_status_placeholder: 'Sélectionnez un état de publication',
    version: 'Version',
    version_placeholder: 'Entrez la version',
    created_at: 'Date de création',
    created_at_placeholder: 'Date de création',
    updated_at: 'Date de mise à jour',
    updated_at_placeholder: 'Date de mise à jour',
    last_review_at: 'Date de dernière revue',
    last_review_at_placeholder: 'Sélectionnez la date de dernière revue',
    next_review_at: 'Date de prochaine revue',
    next_review_at_placeholder: 'Sélectionnez la date de prochaine revue',
    license_type: 'Licence ou droits d\'auteur',
    license_type_placeholder: 'Entrez le type de licence',
    assigned_group: 'Groupe validateur',
    assigned_group_placeholder: 'Sélectionnez le groupe validateur',
    assigned_to_person: 'Utilisateur validateur',
    assigned_to_person_placeholder: 'Sélectionnez l\'utilisateur validateur',
    involved_process: 'Processus associé',
    involved_process_placeholder: 'Sélectionnez le processus rattaché à l\'article',
    attachments_count: 'Nombre de pièces jointes',
    tieds_tickets_count: 'Nombre de tickets liés',
  },
  
  project: {
    // Informations générales
    name: 'Nom du projet',
    name_placeholder: 'Entrez le nom du projet',
    description: 'Description',
    description_placeholder: 'Décrivez le projet en détail',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    
    // Attributs étendus
    key: 'Code du projet',
    key_placeholder: 'Entrez le code unique du projet (ex: PROJ)',
    start_date: 'Date de début',
    start_date_placeholder: 'Sélectionnez la date de début',
    end_date: 'Date de fin',
    end_date_placeholder: 'Sélectionnez la date de fin',
    issue_type_scheme_id: 'Schéma des types de tickets',
    issue_type_scheme_id_placeholder: 'Sélectionnez un schéma',
    visibility: 'Visibilité',
    visibility_placeholder: 'Sélectionnez le niveau de visibilité',
    project_type: 'Type de projet',
    project_type_placeholder: 'Sélectionnez le type de projet',
    
    // Assignation
    team_id: 'Équipe du projet',
    team_id_placeholder: 'Sélectionnez l\'équipe du projet',
    lead_user_id: 'Responsable du projet',
    lead_user_id_placeholder: 'Sélectionnez le responsable',
    access_to_groups: 'Seuls les groupes sélectionnés pourront accéder au projet',
    access_to_groups_placeholder: 'Sélectionnez le ou les groupes',
    access_to_users: 'Seuls les utilisateurs sélectionnés pourront accéder au projet',
    access_to_users_placeholder: 'Sélectionnez le ou les utilisateurs',

    // Comptage des tickets liés
    defect_count: 'Nombre de bugs ouverts',
    us_count: 'Nombre d\'user stories ouvertes',
    epic_count: 'Nombre d\'épopées ouvertes',
    sprint_count: 'Nombre de sprints ouverts'
  },
  
  task: {
    // Informations générales
    title: 'Titre',
    title_placeholder: 'Entrez le titre de la tâche',
    description: 'Description',
    description_placeholder: 'Entrez la description de la tâche',
    status: 'Statut',
    status_placeholder: 'Sélectionnez un statut',
    requested_by: 'Demandeur',
    requested_by_placeholder: 'Sélectionnez un demandeur',
    requested_for: 'Demandé pour',
    requested_for_placeholder: 'Sélectionnez un destinataire',
    assigned_team_label: 'Équipe assignée',
    assigned_team_placeholder: 'Sélectionnez une équipe',
    assigned_to_label: 'Assigné à',
    assigned_to_placeholder: 'Sélectionnez une personne',
    watcher: 'Observateurs',
    watcher_placeholder: 'Sélectionnez des observateurs',
    watcher_helper_text: 'Les observateurs recevront des notifications sur les mises à jour de cette tâche'
  },

  defect: {
    // Informations générales
    title: 'Titre',
    title_placeholder: 'Entrez le titre du défaut',
    description: 'Description',
    description_placeholder: 'Décrivez le défaut en détail',
    status: 'Statut',
    status_placeholder: 'Sélectionnez le statut du défaut',
    ticket_status_code: 'Statut',
    ticket_status_code_placeholder: 'Sélectionnez le statut du défaut',
    severity: 'Sévérité',
    severity_placeholder: 'Sélectionnez la sévérité',
    impact_area: 'Zone d\'impact',
    impact_area_placeholder: 'Sélectionnez la zone d\'impact',
    environment: 'Environnement',
    environment_placeholder: 'Sélectionnez l\'environnement',
    
    // Personnes
    detected_by: 'Détecté par',
    detected_by_placeholder: 'Sélectionnez la personne qui a détecté le défaut',
    reported_by: 'Rapporté par',
    reported_by_placeholder: 'Sélectionnez la personne qui rapporte le défaut',
    
    // Projet et assignation
    project_id: 'Projet',
    project_id_placeholder: 'Sélectionnez le projet associé',
    assignee: 'Assigné à',
    assignee_placeholder: 'Sélectionnez la personne en charge de la correction',
    team_id: 'Équipe',
    team_id_placeholder: 'Sélectionnez l\'équipe en charge de la correction',
    
    // Détails techniques
    steps_to_reproduce: 'Étapes pour reproduire',
    steps_to_reproduce_placeholder: 'Décrivez les étapes pour reproduire le défaut',
    expected_behavior: 'Comportement attendu',
    expected_behavior_placeholder: 'Décrivez le comportement attendu',
    workaround: 'Solution de contournement',
    workaround_placeholder: 'Décrivez la solution de contournement si elle existe',
    
    // Métadonnées
    tags: 'Tags',
    tags_placeholder: 'Ajoutez des tags pour catégoriser ce défaut',
    attachments: 'Pièces jointes',
    attachments_placeholder: 'Glisser-déposer pour importer des fichiers',
    attachments_helper_text: 'Limite : 6 Mo pour les images, 10 Mo pour les autres fichiers',
    attachments_count: 'Nombre de pièces jointes'
  },
  
  sprint: {
    // Informations générales
    name: 'Nom du sprint',
    name_placeholder: 'Entrez le nom du sprint',
    goal: 'Objectif du sprint',
    goal_placeholder: 'Décrivez l\'objectif du sprint',
    state: 'État du sprint',
    state_placeholder: 'Sélectionnez l\'état du sprint',
    reported_by: 'Créé par',
    
    // Attributs étendus
    project_id: 'Projet associé',
    project_id_placeholder: 'Sélectionnez le projet associé',
    start_date: 'Date de début du sprint',
    start_date_placeholder: 'Sélectionnez la date de début du sprint',
    end_date: 'Date de fin du sprint',
    end_date_placeholder: 'Sélectionnez la date de fin du sprint',
    stories_count: 'Nombre de stories',
    tasks_count: 'Nombre de tâches',
    actual_velocity: 'Vélocité réelle',
    actual_velocity_placeholder: 'Entrez la vélocité réelle du sprint',
    estimated_velocity: 'Vélocité estimée',
    estimated_velocity_placeholder: 'Entrez la vélocité estimée du sprint'
  },
  
  fileUploader: {
    dropzone_placeholder: 'Glisser-déposer pour importer',
    browse_button: 'Sélectionner les fichiers',
    required_error: 'Veuillez ajouter au moins un fichier',
    file_too_large: 'Fichier trop volumineux (max 10 Mo)',
    forbidden_file_type: 'Type de fichier non autorisé',
    preview: 'Prévisualiser',
    delete: 'Supprimer',
    or: ' - ou - ',
    limits_info: 'LIMITES TAILLE FICHIER : 6 Mo pour les images, 10 Mo pour les autres fichiers'
  }
}
