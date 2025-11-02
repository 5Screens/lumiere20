import { defineStore } from 'pinia'

export const usePaneStore = defineStore('pane', {
  state: () => ({
    // Configuration des différents panneaux
    paneConfigs: {
      
      serviceHub: {
        type: 'serviceHub',
        hasSections: false,
        items: [
          { tabToOpen: 'incidents', icon: 'fas fa-exclamation-circle', label: 'serviceHub.incidents', className: 'Incident' },
          { tabToOpen: 'problems', icon: 'fas fa-search-minus', label: 'serviceHub.problems', className: 'Problem' },
          { tabToOpen: 'tasks', icon: 'fas fa-ticket-alt', label: 'serviceHub.tasks', className: 'Task' },
          { tabToOpen: 'changes', icon: 'fas fa-exchange-alt', label: 'serviceHub.changes', className: 'Change' },
          { tabToOpen: 'knowledge', icon: 'fas fa-book', label: 'serviceHub.knowledge', className: 'Knowledge_article' }
        ],
        sections: []
      },
      sprintCenter: {
        type: 'sprintCenter',
        hasSections: false,
        items: [
          { tabToOpen: 'tasks', icon: 'fas fa-ticket-alt', label: 'sprintCenter.tasks', className: 'Task' },
          { tabToOpen: 'stories', icon: 'fas fa-book', label: 'sprintCenter.userStories', className: 'Story' },
          { tabToOpen: 'projects', icon: 'fas fa-project-diagram', label: 'sprintCenter.projects', className: 'Project' },
          { tabToOpen: 'sprints', icon: 'fas fa-running', label: 'sprintCenter.sprints', className: 'Sprint' },
          { tabToOpen: 'epics', icon: 'fas fa-bookmark', label: 'sprintCenter.epics', className: 'Epic' },
          { tabToOpen: 'defects', icon: 'fas fa-bug', label: 'sprintCenter.bugs', className: 'Defect' }
        ],
        sections: []
      },
      admin: {
        type: 'admin',
        hasSections: false,
        items: [
          { tabToOpen: 'mail-servers', icon: 'fas fa-mail-bulk', label: 'admin.mailServers', className: null },
          { tabToOpen: 'email-notifications', icon: 'fas fa-envelope', label: 'admin.emailNotifications', className: null },
          { tabToOpen: 'sms-notifications', icon: 'fas fa-sms', label: 'admin.smsNotifications', className: null },
          { tabToOpen: 'authentication', icon: 'fas fa-shield-alt', label: 'admin.authentication', className: null },
          { tabToOpen: 'ssl-certificates', icon: 'fas fa-certificate', label: 'admin.sslCertificates', className: null },
          { tabToOpen: 'mfa', icon: 'fas fa-key', label: 'admin.mfa', className: null },
          { tabToOpen: 'ip-restrictions', icon: 'fas fa-network-wired', label: 'admin.ipRestrictions', className: null },
          { tabToOpen: 'audit-logs', icon: 'fas fa-history', label: 'admin.auditLogs', className: null },
          { tabToOpen: 'api-tokens', icon: 'fas fa-key', label: 'admin.apiTokens', className: null },
          { tabToOpen: 'connectors', icon: 'fas fa-plug', label: 'admin.connectors', className: null },
          { tabToOpen: 'performance', icon: 'fas fa-tachometer-alt', label: 'admin.performance', className: null },
          { tabToOpen: 'backup', icon: 'fas fa-database', label: 'admin.backup', className: null }
        ],
        sections: []
      },
      configuration: {
        type: 'configuration',
        hasSections: true,
        items: [],
        sections: [
          {
            id: 'serviceManagement',
            label: 'configuration.serviceManagement.title',
            items: [
              { tabToOpen: 'changeSetup', icon: 'fas fa-cog', label: 'configuration.serviceManagement.changeSetup', className: 'ChangeSetup' },
              { tabToOpen: 'changeQuestions', icon: 'fas fa-question-circle', label: 'configuration.serviceManagement.changeQuestions', className: 'ChangeQuestions' },
              { tabToOpen: 'changeOptions', icon: 'fas fa-exchange-alt', label: 'configuration.serviceManagement.changeOptions', className: 'ChangeOptions' },
              { tabToOpen: 'problemCategories', icon: 'fas fa-tags', label: 'configuration.serviceManagement.problemCategories', className: 'ProblemCategories' },
              { tabToOpen: 'incidentSetup', icon: 'fas fa-exclamation-triangle', label: 'configuration.serviceManagement.incidentSetup', className: 'IncidentSetup' },
              { tabToOpen: 'symptoms', icon: 'fas fa-stethoscope', label: 'configuration.serviceManagement.symptoms', className: 'Symptom' },
              { tabToOpen: 'knowledge_setup', icon: 'fas fa-book-open', label: 'configuration.serviceManagement.knowledgeSetup', className: 'KnowledgeSetup' }
            ]
          },
          {
            id: 'agileBacklog',
            label: 'configuration.agileBacklog.title',
            items: [
              { tabToOpen: 'defect_setup', icon: 'fas fa-bug', label: 'configuration.agileBacklog.defectSetup', className: 'DefectSetup' },
              { tabToOpen: 'projectSetup', icon: 'fas fa-project-diagram', label: 'configuration.agileBacklog.projectSetup', className: 'ProjectSetup' }
            ]
          },
          {
            id: 'foundations',
            label: 'configuration.foundations.title',
            items: [
              { tabToOpen: 'entitySetup', icon: 'fas fa-cogs', label: 'configuration.foundations.entitySetup', className: 'EntitySetup' },
              { tabToOpen: 'contact_types', icon: 'fas fa-phone', label: 'configuration.foundations.contactTypes', className: 'ContactType' }
            ]
          }
        ]
      },
      mail: {
        type: 'mail',
        hasSections: false,
        items: [],
        sections: []
      },
      portalsBuilder: {
        type: 'portalsBuilder',
        hasSections: false,
        items: [],
        sections: []
      },
      tableaux: {
        type: 'tableaux',
        hasSections: false,
        items: [],
        sections: []
      },
      dataPane: {
        type: 'dataPane',
        hasSections: true,
        items: [],
        sections: [
          {
            id: 'foundations',
            label: 'dataPane.foundations.title',
            items: [
              { tabToOpen: 'entities', icon: 'fas fa-cube', label: 'dataPane.foundations.entities', className: 'Entity' },
              { tabToOpen: 'locations', icon: 'fas fa-map-marker-alt', label: 'dataPane.foundations.locations', className: 'Location' },
              { tabToOpen: 'persons', icon: 'fas fa-user', label: 'dataPane.foundations.persons', className: 'Person' },
              { tabToOpen: 'groups', icon: 'fas fa-users', label: 'dataPane.foundations.groups', className: 'Group' }
            ]
          },
          {
            id: 'applications',
            label: 'dataPane.applications.title',
            items: [
              { tabToOpen: 'deployed-applications', icon: 'fas fa-rocket', label: 'dataPane.applications.deployed', className: null },
              { tabToOpen: 'applications', icon: 'fas fa-cube', label: 'dataPane.applications.application', className: null },
              { tabToOpen: 'virtual-client', icon: 'fas fa-desktop', label: 'dataPane.applications.virtualClient', className: null }
            ]
          },
          {
            id: 'hardware',
            label: 'dataPane.hardware.title',
            items: [
              { tabToOpen: 'hardware', icon: 'fas fa-microchip', label: 'dataPane.hardware.hardware', className: null },
              { tabToOpen: 'deployed-hardware', icon: 'fas fa-server', label: 'dataPane.hardware.deployedHardware', className: null },
              { tabToOpen: 'workstation', icon: 'fas fa-desktop', label: 'dataPane.hardware.workstation', className: null },
              { tabToOpen: 'server', icon: 'fas fa-server', label: 'dataPane.hardware.server', className: null },
              { tabToOpen: 'storage', icon: 'fas fa-hdd', label: 'dataPane.hardware.storage', className: null },
              { tabToOpen: 'rack', icon: 'fas fa-layer-group', label: 'dataPane.hardware.rack', className: null },
              { tabToOpen: 'ups', icon: 'fas fa-plug', label: 'dataPane.hardware.ups', className: null }
            ]
          },
          {
            id: 'network',
            label: 'dataPane.network.title',
            items: [
              { tabToOpen: 'firewall', icon: 'fas fa-shield-alt', label: 'dataPane.network.firewall', className: null },
              { tabToOpen: 'switch', icon: 'fas fa-network-wired', label: 'dataPane.network.switch', className: null },
              { tabToOpen: 'router', icon: 'fas fa-wifi', label: 'dataPane.network.router', className: null },
              { tabToOpen: 'routing-rule', icon: 'fas fa-route', label: 'dataPane.network.routingRule', className: null },
              { tabToOpen: 'network-printer', icon: 'fas fa-print', label: 'dataPane.network.printer', className: null },
              { tabToOpen: 'zone-cluster', icon: 'fas fa-project-diagram', label: 'dataPane.network.zoneCluster', className: null }
            ]
          },
          {
            id: 'virtualization',
            label: 'dataPane.virtualization.title',
            items: [
              { tabToOpen: 'virtual-rack-billing', icon: 'fas fa-file-invoice-dollar', label: 'dataPane.virtualization.billing', className: null },
              { tabToOpen: 'farm', icon: 'fas fa-server', label: 'dataPane.virtualization.farm', className: null }
            ]
          },
          {
            id: 'database',
            label: 'dataPane.database.title',
            items: [
              { tabToOpen: 'database-catalog', icon: 'fas fa-database', label: 'dataPane.database.catalog', className: null },
              { tabToOpen: 'database-instance', icon: 'fas fa-database', label: 'dataPane.database.instance', className: null }
            ]
          },
          {
            id: 'contracts',
            label: 'dataPane.contracts.title',
            items: [
              { tabToOpen: 'contract', icon: 'fas fa-file-contract', label: 'dataPane.contracts.contract', className: null },
              { tabToOpen: 'software-license', icon: 'fas fa-key', label: 'dataPane.contracts.license', className: null }
            ]
          },
          {
            id: 'cloud',
            label: 'dataPane.cloud.title',
            items: [
              { tabToOpen: 'cloud-service', icon: 'fas fa-cloud-upload-alt', label: 'dataPane.cloud.service', className: null }
            ]
          }
        ]
      }
    },
    
    // État de visibilité des panneaux
    visiblePane: null,
    
    // Timeouts pour la fermeture automatique
    closeTimeouts: {
      admin: null,
      configuration: null,
      data: null,
      serviceHub: null,
      sprintCenter: null
    }
  }),
  
  actions: {
    togglePane(paneType) {
      console.log('togglePane appelé avec:', paneType);
      console.log('État actuel visiblePane:', this.visiblePane);
      
      if (this.visiblePane === paneType) {
        this.visiblePane = null
        console.log('Panneau fermé, nouvel état:', this.visiblePane);
      } else {
        this.visiblePane = paneType
        console.log('Panneau ouvert, nouvel état:', this.visiblePane);
      }
      
      // Effacer le timeout si le panneau est fermé
      if (!this.visiblePane) {
        clearTimeout(this.closeTimeouts[paneType])
      }
    },
    
    closePane(paneType) {
      if (this.visiblePane === paneType) {
        this.visiblePane = null
      }
    },
    
    handleMouseEnter(paneType) {
      if (this.closeTimeouts[paneType]) {
        clearTimeout(this.closeTimeouts[paneType])
        this.closeTimeouts[paneType] = null
      }
    },
    
    handleMouseLeave(paneType) {
      this.closeTimeouts[paneType] = setTimeout(() => {
        if (this.visiblePane === paneType) {
          this.visiblePane = null
        }
      }, 500)
    },
    
    getPaneConfig(paneType) {
      return this.paneConfigs[paneType] || null
    },
    
    isPaneVisible(paneType) {
      return this.visiblePane === paneType
    }
  }
})
