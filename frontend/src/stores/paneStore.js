import { defineStore } from 'pinia'

export const usePaneStore = defineStore('pane', {
  state: () => ({
    // Configuration des différents panneaux
    paneConfigs: {
      admin: {
        type: 'admin',
        hasSections: false,
        items: [
          { tabToOpen: 'mail-servers', icon: 'fas fa-mail-bulk', label: 'admin.mailServers' },
          { tabToOpen: 'email-notifications', icon: 'fas fa-envelope', label: 'admin.emailNotifications' },
          { tabToOpen: 'sms-notifications', icon: 'fas fa-sms', label: 'admin.smsNotifications' },
          { tabToOpen: 'authentication', icon: 'fas fa-shield-alt', label: 'admin.authentication' },
          { tabToOpen: 'ssl-certificates', icon: 'fas fa-certificate', label: 'admin.sslCertificates' },
          { tabToOpen: 'mfa', icon: 'fas fa-key', label: 'admin.mfa' },
          { tabToOpen: 'ip-restrictions', icon: 'fas fa-network-wired', label: 'admin.ipRestrictions' },
          { tabToOpen: 'audit-logs', icon: 'fas fa-history', label: 'admin.auditLogs' },
          { tabToOpen: 'api-tokens', icon: 'fas fa-key', label: 'admin.apiTokens' },
          { tabToOpen: 'connectors', icon: 'fas fa-plug', label: 'admin.connectors' },
          { tabToOpen: 'performance', icon: 'fas fa-tachometer-alt', label: 'admin.performance' },
          { tabToOpen: 'backup', icon: 'fas fa-database', label: 'admin.backup' }
        ],
        sections: []
      },
      configuration: {
        type: 'configuration',
        hasSections: false,
        items: [
          { tabToOpen: 'companies', icon: 'fas fa-building', label: 'configuration.companies' },
          { tabToOpen: 'locations', icon: 'fas fa-map-marker-alt', label: 'configuration.locations' },
          { tabToOpen: 'sites', icon: 'fas fa-sitemap', label: 'configuration.sites' },
          { tabToOpen: 'entities', icon: 'fas fa-cube', label: 'configuration.entities' },
          { tabToOpen: 'departments', icon: 'fas fa-users', label: 'configuration.departments' },
          { tabToOpen: 'persons', icon: 'fas fa-user', label: 'configuration.persons' },
          { tabToOpen: 'support-groups', icon: 'fas fa-user-friends', label: 'configuration.supportGroups' },
          { tabToOpen: 'roles', icon: 'fas fa-user-shield', label: 'configuration.roles' },
          { tabToOpen: 'ticket-status', icon: 'fas fa-tasks', label: 'configuration.ticketStatus' },
          { tabToOpen: 'symptoms', icon: 'fas fa-stethoscope', label: 'configuration.symptoms' },
          { tabToOpen: 'ticket-types', icon: 'fas fa-ticket-alt', label: 'configuration.ticketTypes' },
          { tabToOpen: 'workflows', icon: 'fas fa-project-diagram', label: 'configuration.workflows' }
        ],
        sections: []
      },
      dataPane: {
        type: 'dataPane',
        hasSections: true,
        items: [],
        sections: [
          {
            id: 'applications',
            label: 'dataPane.applications.title',
            items: [
              { tabToOpen: 'deployed-applications', icon: 'fas fa-rocket', label: 'dataPane.applications.deployed' },
              { tabToOpen: 'applications', icon: 'fas fa-cube', label: 'dataPane.applications.application' },
              { tabToOpen: 'virtual-client', icon: 'fas fa-desktop', label: 'dataPane.applications.virtualClient' }
            ]
          },
          {
            id: 'hardware',
            label: 'dataPane.hardware.title',
            items: [
              { tabToOpen: 'hardware', icon: 'fas fa-microchip', label: 'dataPane.hardware.hardware' },
              { tabToOpen: 'deployed-hardware', icon: 'fas fa-server', label: 'dataPane.hardware.deployedHardware' },
              { tabToOpen: 'workstation', icon: 'fas fa-desktop', label: 'dataPane.hardware.workstation' },
              { tabToOpen: 'server', icon: 'fas fa-server', label: 'dataPane.hardware.server' },
              { tabToOpen: 'storage', icon: 'fas fa-hdd', label: 'dataPane.hardware.storage' },
              { tabToOpen: 'rack', icon: 'fas fa-layer-group', label: 'dataPane.hardware.rack' },
              { tabToOpen: 'ups', icon: 'fas fa-plug', label: 'dataPane.hardware.ups' }
            ]
          },
          {
            id: 'network',
            label: 'dataPane.network.title',
            items: [
              { tabToOpen: 'firewall', icon: 'fas fa-shield-alt', label: 'dataPane.network.firewall' },
              { tabToOpen: 'switch', icon: 'fas fa-network-wired', label: 'dataPane.network.switch' },
              { tabToOpen: 'router', icon: 'fas fa-wifi', label: 'dataPane.network.router' },
              { tabToOpen: 'routing-rule', icon: 'fas fa-route', label: 'dataPane.network.routingRule' },
              { tabToOpen: 'network-printer', icon: 'fas fa-print', label: 'dataPane.network.printer' },
              { tabToOpen: 'zone-cluster', icon: 'fas fa-project-diagram', label: 'dataPane.network.zoneCluster' }
            ]
          },
          {
            id: 'virtualization',
            label: 'dataPane.virtualization.title',
            items: [
              { tabToOpen: 'virtual-rack-billing', icon: 'fas fa-file-invoice-dollar', label: 'dataPane.virtualization.billing' },
              { tabToOpen: 'farm', icon: 'fas fa-server', label: 'dataPane.virtualization.farm' }
            ]
          },
          {
            id: 'database',
            label: 'dataPane.database.title',
            items: [
              { tabToOpen: 'database-catalog', icon: 'fas fa-database', label: 'dataPane.database.catalog' },
              { tabToOpen: 'database-instance', icon: 'fas fa-database', label: 'dataPane.database.instance' }
            ]
          },
          {
            id: 'contracts',
            label: 'dataPane.contracts.title',
            items: [
              { tabToOpen: 'contract', icon: 'fas fa-file-contract', label: 'dataPane.contracts.contract' },
              { tabToOpen: 'software-license', icon: 'fas fa-key', label: 'dataPane.contracts.license' }
            ]
          },
          {
            id: 'cloud',
            label: 'dataPane.cloud.title',
            items: [
              { tabToOpen: 'cloud-service', icon: 'fas fa-cloud-upload-alt', label: 'dataPane.cloud.service' }
            ]
          }
        ]
      },
      serviceHub: {
        type: 'serviceHub',
        hasSections: false,
        items: [
          { tabToOpen: 'incidents', icon: 'fas fa-exclamation-circle', label: 'serviceHub.incidents' },
          { tabToOpen: 'problems', icon: 'fas fa-search-minus', label: 'serviceHub.problems' },
          { tabToOpen: 'tickets', icon: 'fas fa-ticket-alt', label: 'serviceHub.tickets' },
          { tabToOpen: 'changes', icon: 'fas fa-exchange-alt', label: 'serviceHub.changes' },
          { tabToOpen: 'knowledge', icon: 'fas fa-book', label: 'serviceHub.knowledge' }
        ],
        sections: []
      },
      sprintCenter: {
        type: 'sprintCenter',
        hasSections: false,
        items: [
          { tabToOpen: 'tickets', icon: 'fas fa-ticket-alt', label: 'sprintCenter.tickets' },
          { tabToOpen: 'user-stories', icon: 'fas fa-book', label: 'sprintCenter.userStories' },
          { tabToOpen: 'projects', icon: 'fas fa-project-diagram', label: 'sprintCenter.projects' }
        ],
        sections: []
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
