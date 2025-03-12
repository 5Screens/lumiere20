export default {
  theme: {
    title: 'Tema',
    light: 'Claro',
    dark: 'Oscuro'
  },
  language: {
    title: 'Idioma',
    fr: 'Francés',
    en: 'Inglés',
    pt: 'Portugués',
    es: 'Español'
  },
  nav: {
    myWork: 'Mi Trabajo',
    create: 'Crear',
    search: 'Buscar...',
    serviceHub: 'Centro de Servicios',
    sprintCenter: 'Centro Sprint',
    mail: 'Correo',
    portalsBuilder: 'Constructor de Portales',
    data: 'Datos',
    tableaux: 'Tablas',
    configuration: 'Configuración',
    administration: 'Administración'
  },
  serviceHub: {
    title: 'Centro de Servicios',
    incidents: 'Incidentes',
    tickets: 'Tickets'
  },
  configuration: {
    title: 'Configuración',
    companies: 'Empresas',
    locations: 'Ubicaciones',
    sites: 'Sitios',
    entities: 'Entidades',
    departments: 'Departamentos',
    persons: 'Personas',
    supportGroups: 'Grupos de soporte',
    roles: 'Roles y permisos',
    ticketStatus: 'Estados de tickets',
    symptoms: 'Síntomas',
    ticketTypes: 'Tipos de tickets',
    workflows: 'Flujos de trabajo',
    import: 'Importar',
    export: 'Exportar',
    refresh: 'Actualizar'
  },
  admin: {
    title: 'Administración',
    rolesAndPermissions: 'Roles y Permisos',
    ticketTypes: 'Tipos de Tickets',
    mailServers: 'Servidores de Correo',
    emailNotifications: 'Notificaciones de Email',
    smsNotifications: 'Notificaciones SMS',
    authentication: 'Autenticación',
    sslCertificates: 'Certificados SSL/TLS',
    mfa: 'MFA',
    ipRestrictions: 'Restricciones IP',
    auditLogs: 'Registros de Auditoría',
    apiTokens: 'Tokens API y Secretos',
    connectors: 'Conectores',
    performance: 'Rendimiento de la Plataforma',
    backup: 'Copia de Seguridad y Restauración'
  },
  dataPane: {
    title: 'Datos',
    applications: {
      title: 'Aplicaciones',
      deployed: 'Aplicación Desplegada',
      application: 'Aplicación',
      virtualClient: 'Entorno de Cliente Virtual'
    },
    hardware: {
      title: 'Infraestructura de Hardware',
      hardware: 'Hardware',
      deployedHardware: 'Hardware Desplegado',
      workstation: 'Estación de Trabajo',
      server: 'Servidor',
      storage: 'Dispositivo de Almacenamiento Masivo',
      rack: 'Rack',
      ups: 'UPS'
    },
    network: {
      title: 'Red y Comunicaciones',
      firewall: 'Cortafuegos',
      switch: 'Conmutador',
      router: 'Enrutador',
      routingRule: 'Regla de Enrutamiento',
      printer: 'Impresora',
      zoneCluster: 'Clúster de Zona'
    },
    virtualization: {
      title: 'Virtualización',
      billing: 'Facturación de Rack Virtual',
      farm: 'Granja'
    },
    database: {
      title: 'Bases de Datos',
      catalog: 'Catálogo de Base de Datos',
      instance: 'Instancia de Base de Datos'
    },
    contracts: {
      title: 'Contratos y Licencias',
      contract: 'Contrato',
      license: 'Licencia de Software',
      counter: 'Contador de Software'
    },
    userDevice: {
      title: 'Dispositivo de Usuario',
      mobile: 'Móvil',
      laptop: 'Portátil',
      printer: 'Impresora'
    },
    cloud: {
      title: 'Infraestructura en la Nube',
      vm: 'Máquina Virtual',
      service: 'Servicio en la Nube',
      storage: 'Almacenamiento en la Nube'
    },
    container: {
      title: 'Contenedorización',
      container: 'Contenedor'
    },
    security: {
      title: 'Seguridad',
      antivirus: 'Antivirus',
      endpoint: 'Protección de Endpoints'
    }
  },
  entitiesTable: {
    headers: {
      uuid: 'ID',
      entity_id: 'ID de Entidad',
      name: 'Nombre',
      parent_entity_name: 'Nombre de Entidad Padre',
      external_id: 'ID Externo',
      entity_type: 'Tipo de Entidad',
      headquarters_location: 'Ubicación de la Sede',
      is_active: 'Activo',
      budget_approver_name: 'Aprobador de Presupuesto',
      date_creation: 'Fecha de Creación',
      date_modification: 'Fecha de Modificación'
    }
  },
  sprintCenter: {
    title: 'Centro Sprint',
    tickets: 'Tickets',
    userStories: 'Historias de Usuario'
  },
  symptomsTable: {
    headers: {
      id: 'Id',
      createdDate: 'Fecha de creación',
      updateDate: 'Fecha de actualización',
      symptomCode: 'Código de síntoma',
      symptomLabel: 'Etiqueta de síntoma',
      symptomLanguage: 'Idioma'
    }
  },
  audit: {
    eventType: 'Tipo de Evento',
    objectType: 'Tipo de Objeto',
    oldValue: 'Valor Anterior',
    newValue: 'Valor Nuevo',
    user: 'Usuario',
    time: 'Tiempo',
    totalChanges: 'Total de Cambios',
    noData: 'No hay datos de auditoría disponibles',
    timeAgo: {
      justNow: 'ahora mismo',
      seconds: 'hace unos segundos',
      minute: 'hace 1 minuto',
      minutes: 'hace {count} minutos',
      hour: 'hace 1 hora',
      hours: 'hace {count} horas',
      day: 'hace 1 día',
      days: 'hace {count} días',
      month: 'hace 1 mes',
      months: 'hace {count} meses',
      year: 'hace 1 año',
      years: 'hace {count} años'
    }
  },
  entities: {
    name: 'Nombre de la Entidad',
    entity_id: 'ID de Entidad',
    external_id: 'ID Externo',
    entity_type: 'Tipo de Entidad',
    is_active: 'Activo',
    saveSuccess: 'Entidad guardada con éxito',
    saveError: 'Error al guardar la entidad',
    updateSuccess: 'Entidad actualizada con éxito'
  },
  errors: {
    badRequest: 'Solicitud incorrecta (400)',
    unauthorized: 'No autorizado (401)',
    forbidden: 'Acceso prohibido (403)',
    notFound: 'Recurso no encontrado (404)',
    conflict: 'Conflicto con el estado actual (409)',
    validationError: 'Error de validación de datos (422)',
    serverError: 'Error interno del servidor (500)',
    serviceUnavailable: 'Servicio temporalmente no disponible (503)',
    fetchActiveLanguages: 'No se pudieron cargar los idiomas activos',
    fetchSymptomData: 'No se pudieron cargar los datos del síntoma',
    defaultError: 'Ha ocurrido un error',
    selectOneRowForUpdate: 'Por favor, seleccione una fila para actualizar',
    selectRowsForUpdate: 'Por favor, seleccione al menos una fila para actualizar',
    selectRowsForDelete: 'Por favor, seleccione al menos una fila para eliminar',
    noTranslations: 'Por favor, ingrese al menos una traducción para el síntoma',
    requiredFields: 'Por favor, complete todos los campos obligatorios'
  },
  common: {
    close: 'Cerrar',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    create: 'Crear',
    update: 'Actualizar',
    export: 'Exportar',
    refresh: 'Actualizar',
    loading: 'Cargando...',
    selectOption: 'Seleccione una opción',
    loading_in_progress: 'Carga en progreso',
    confirm_edit: 'Confirmar edición',
    cancel_edit: 'Cancelar edición'
  },
  nav: {
    myWork: 'Mi Trabajo',
    create: 'Crear',
    search: 'Buscar...',
    serviceHub: 'Centro de Servicios',
    sprintCenter: 'Centro Sprint',
    mail: 'Correo',
    portalsBuilder: 'Constructor de Portales',
    data: 'Datos',
    tableaux: 'Tablas',
    configuration: 'Configuración',
    administration: 'Administración'
  }
}
