export default {
  theme: {
    title: 'Tema',
    light: 'Claro',
    dark: 'Escuro'
  },
  language: {
    title: 'Idioma',
    fr: 'Francês',
    en: 'Inglês',
    pt: 'Português',
    es: 'Espanhol'
  },
  nav: {
    myWork: 'Meu Trabalho',
    create: 'Criar',
    search: 'Pesquisar...',
    serviceHub: 'Central de Serviços',
    sprintCenter: 'Centro Sprint',
    mail: 'E-mail',
    portalsBuilder: 'Construtor de Portais',
    data: 'Dados',
    tableaux: 'Tabelas',
    configuration: 'Configuração',
    administration: 'Administração'
  },
  serviceHub: {
    title: 'Central de Serviços',
    incidents: 'Incidentes',
    tickets: 'Tickets'
  },
  configuration: {
    title: 'Configuração',
    companies: 'Empresas',
    locations: 'Localizações',
    sites: 'Sites',
    entities: 'Entidades',
    departments: 'Departamentos',
    persons: 'Pessoas',
    supportGroups: 'Grupos de suporte',
    roles: 'Funções e permissões',
    ticketStatus: 'Status dos tickets',
    symptoms: 'Sintomas',
    ticketTypes: 'Tipos de tickets',
    workflows: 'Fluxos de trabalho',
    import: 'Importar',
    export: 'Exportar',
    refresh: 'Atualizar'
  },
  admin: {
    title: 'Administração',
    rolesAndPermissions: 'Funções e Permissões',
    ticketTypes: 'Tipos de Tickets',
    mailServers: 'Servidores de Email',
    emailNotifications: 'Notificações de Email',
    smsNotifications: 'Notificações SMS',
    authentication: 'Autenticação',
    sslCertificates: 'Certificados SSL/TLS',
    mfa: 'MFA',
    ipRestrictions: 'Restrições de IP',
    auditLogs: 'Logs de Auditoria',
    apiTokens: 'Tokens API e Segredos',
    connectors: 'Conectores',
    performance: 'Desempenho da Plataforma',
    backup: 'Backup e Restauração'
  },
  dataPane: {
    title: 'Dados',
    applications: {
      title: 'Aplicações',
      deployed: 'Aplicação Implantada',
      application: 'Aplicação',
      virtualClient: 'Ambiente de Cliente Virtual'
    },
    hardware: {
      title: 'Infraestrutura de Hardware',
      hardware: 'Hardware',
      deployedHardware: 'Hardware Implantado',
      workstation: 'Estação de Trabalho',
      server: 'Servidor',
      storage: 'Dispositivo de Armazenamento em Massa',
      rack: 'Rack',
      ups: 'UPS'
    },
    network: {
      title: 'Rede e Comunicações',
      firewall: 'Firewall',
      switch: 'Switch',
      router: 'Roteador',
      routingRule: 'Regra de Roteamento',
      printer: 'Impressora',
      zoneCluster: 'Cluster de Zona'
    },
    virtualization: {
      title: 'Virtualização',
      billing: 'Faturamento de Rack Virtual',
      farm: 'Fazenda'
    },
    database: {
      title: 'Bancos de Dados',
      catalog: 'Catálogo de Banco de Dados',
      instance: 'Instância de Banco de Dados'
    },
    contracts: {
      title: 'Contratos e Licenças',
      contract: 'Contrato',
      license: 'Licença de Software',
      counter: 'Contador de Software'
    },
    userDevice: {
      title: 'Dispositivo do Usuário',
      mobile: 'Móvel',
      laptop: 'Notebook',
      printer: 'Impressora'
    },
    cloud: {
      title: 'Infraestrutura em Nuvem',
      vm: 'Máquina Virtual',
      service: 'Serviço em Nuvem',
      storage: 'Armazenamento em Nuvem'
    },
    container: {
      title: 'Conteinerização',
      container: 'Contêiner'
    },
    security: {
      title: 'Segurança',
      antivirus: 'Antivírus',
      endpoint: 'Proteção de Endpoint'
    }
  },
  sprintCenter: {
    title: 'Centro Sprint',
    tickets: 'Tickets',
    userStories: 'Histórias de Usuário'
  },
  entitiesTable: {
    headers: {
      uuid: 'Id',
      entity_id: 'ID da Entidade',
      name: 'Nome',
      parent_entity_name: 'Nome da Entidade Pai',
      external_id: 'ID Externo',
      entity_type: 'Tipo de Entidade',
      headquarters_location: 'Localização da Sede',
      is_active: 'Ativo',
      budget_approver_name: 'Aprovador de Orçamento',
      date_creation: 'Data de Criação',
      date_modification: 'Data de Modificação'
    }
  },
  symptomsTable: {
    headers: {
      id: 'Id',
      createdDate: 'Data de criação',
      updateDate: 'Data de atualização',
      symptomCode: 'Código do sintoma',
      symptomLabel: 'Rótulo do sintoma',
      symptomLanguage: 'Idioma'
    }
  },
  audit: {
    eventType: 'Tipo de Evento',
    objectType: 'Tipo de Objeto',
    oldValue: 'Valor Antigo',
    newValue: 'Valor Novo',
    user: 'Usuário',
    time: 'Tempo',
    totalChanges: 'Total de Alterações',
    noData: 'Nenhum dado de auditoria disponível',
    timeAgo: {
      justNow: 'agora mesmo',
      seconds: 'há alguns segundos',
      minute: 'há 1 minuto',
      minutes: 'há {count} minutos',
      hour: 'há 1 hora',
      hours: 'há {count} horas',
      day: 'há 1 dia',
      days: 'há {count} dias',
      month: 'há 1 mês',
      months: 'há {count} meses',
      year: 'há 1 ano',
      years: 'há {count} anos'
    }
  },
  entities: {
    name: 'Nome da Entidade',
    entity_id: 'ID da Entidade',
    external_id: 'ID Externo',
    entity_type: 'Tipo de Entidade',
    is_active: 'Ativo',
    location: 'Localização da Sede',
    parent: 'Entidade Pai',
    saveSuccess: 'Entidade salva com sucesso',
    saveError: 'Erro ao salvar entidade',
    updateSuccess: 'Entidade atualizada com sucesso',
    createTitle: 'Nova Entidade'
  },
  errors: {
    badRequest: 'Requisição inválida (400)',
    unauthorized: 'Não autorizado (401)',
    forbidden: 'Acesso proibido (403)',
    notFound: 'Recurso não encontrado (404)',
    conflict: 'Conflito com o estado atual (409)',
    validationError: 'Erro de validação de dados (422)',
    serverError: 'Erro interno do servidor (500)',
    serviceUnavailable: 'Serviço temporariamente indisponível (503)',
    fetchActiveLanguages: 'Não foi possível carregar os idiomas ativos',
    fetchSymptomData: 'Não foi possível carregar os dados do sintoma',
    defaultError: 'Ocorreu um erro',
    selectOneRowForUpdate: 'Por favor, selecione uma linha para atualizar',
    selectRowsForUpdate: 'Por favor, selecione pelo menos uma linha para atualizar',
    selectRowsForDelete: 'Por favor, selecione pelo menos uma linha para excluir',
    noTranslations: 'Por favor, insira pelo menos uma tradução para o sintoma',
    requiredFields: 'Por favor, preencha todos os campos obrigatórios'
  },
  common: {
    close: 'Fechar',
    save: 'Salvar',
    cancel: 'Cancelar',
    delete: 'Excluir',
    create: 'Criar',
    update: 'Atualizar',
    export: 'Exportar',
    refresh: 'Atualizar',
    loading: 'Carregando...',
    selectOption: 'Selecione uma opção',
    loading_in_progress: 'Carregamento em andamento',
    confirm_edit: 'Confirmar edição',
    cancel_edit: 'Cancelar edição',
    yes: 'Sim',
    no: 'Não'
  },
  nav: {
    myWork: 'Meu Trabalho',
    create: 'Criar',
    search: 'Pesquisar...',
    serviceHub: 'Central de Serviços',
    sprintCenter: 'Centro Sprint',
    mail: 'E-mail',
    portalsBuilder: 'Construtor de Portais',
    data: 'Dados',
    tableaux: 'Tabelas',
    configuration: 'Configuração',
    administration: 'Administração'
  }
}
