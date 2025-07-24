import { defineStore } from 'pinia'
import { Entity } from '@/models/Entity'
import { Symptom } from '@/models/Symptom'
import { Task } from '@/models/Task'
import { Incident } from '@/models/Incident'
import { Problem } from '@/models/Problem'
import { Change } from '@/models/Change'
import { Knowledge_article } from '@/models/Knowledge_article'
import { Project } from '@/models/Project'
import { Sprint } from '@/models/Sprint'
import { Epic } from '@/models/Epic'
import { Story } from '@/models/Story'
import { Defect } from '@/models/Defect'

export const usePaneStore = defineStore('pane', {
  state: () => ({
    // Configuration des différents panneaux
    paneConfigs: {
      
      serviceHub: {
        type: 'serviceHub',
        hasSections: false,
        items: [
          { tabToOpen: 'incidents', icon: 'fas fa-exclamation-circle', label: 'serviceHub.incidents', class: Incident },
          { tabToOpen: 'problems', icon: 'fas fa-search-minus', label: 'serviceHub.problems', class: Problem },
          { tabToOpen: 'tasks', icon: 'fas fa-ticket-alt', label: 'serviceHub.tasks', class: Task },
          { tabToOpen: 'changes', icon: 'fas fa-exchange-alt', label: 'serviceHub.changes', class: Change },
          { tabToOpen: 'knowledge', icon: 'fas fa-book', label: 'serviceHub.knowledge', class: Knowledge_article }
        ],
        sections: []
      },
      sprintCenter: {
        type: 'sprintCenter',
        hasSections: false,
        items: [
          { tabToOpen: 'tasks', icon: 'fas fa-ticket-alt', label: 'sprintCenter.tasks', class: Task },
          { tabToOpen: 'stories', icon: 'fas fa-book', label: 'sprintCenter.userStories', class: Story },
          { tabToOpen: 'projects', icon: 'fas fa-project-diagram', label: 'sprintCenter.projects', class: Project },
          { tabToOpen: 'sprints', icon: 'fas fa-running', label: 'sprintCenter.sprints', class: Sprint },
          { tabToOpen: 'epics', icon: 'fas fa-bookmark', label: 'sprintCenter.epics', class: Epic },
          { tabToOpen: 'defects', icon: 'fas fa-bug', label: 'sprintCenter.bugs', class: Defect }
        ],
        sections: []
      },
      admin: {
        type: 'admin',
        hasSections: false,
        items: [
          { tabToOpen: 'mail-servers', icon: 'fas fa-mail-bulk', label: 'admin.mailServers', class: null },
          { tabToOpen: 'email-notifications', icon: 'fas fa-envelope', label: 'admin.emailNotifications', class: null },
          { tabToOpen: 'sms-notifications', icon: 'fas fa-sms', label: 'admin.smsNotifications', class: null },
          { tabToOpen: 'authentication', icon: 'fas fa-shield-alt', label: 'admin.authentication', class: null },
          { tabToOpen: 'ssl-certificates', icon: 'fas fa-certificate', label: 'admin.sslCertificates', class: null },
          { tabToOpen: 'mfa', icon: 'fas fa-key', label: 'admin.mfa', class: null },
          { tabToOpen: 'ip-restrictions', icon: 'fas fa-network-wired', label: 'admin.ipRestrictions', class: null },
          { tabToOpen: 'audit-logs', icon: 'fas fa-history', label: 'admin.auditLogs', class: null },
          { tabToOpen: 'api-tokens', icon: 'fas fa-key', label: 'admin.apiTokens', class: null },
          { tabToOpen: 'connectors', icon: 'fas fa-plug', label: 'admin.connectors', class: null },
          { tabToOpen: 'performance', icon: 'fas fa-tachometer-alt', label: 'admin.performance', class: null },
          { tabToOpen: 'backup', icon: 'fas fa-database', label: 'admin.backup', class: null }
        ],
        sections: []
      },
      configuration: {
        type: 'configuration',
        hasSections: false,
        items: [
          { tabToOpen: 'entities', icon: 'fas fa-cube', label: 'configuration.entities', class: Entity },
          { tabToOpen: 'symptoms', icon: 'fas fa-stethoscope', label: 'configuration.symptoms', class: Symptom }
          /*{ tabToOpen: 'companies', icon: 'fas fa-building', label: 'configuration.companies' },
          { tabToOpen: 'locations', icon: 'fas fa-map-marker-alt', label: 'configuration.locations' },
          { tabToOpen: 'sites', icon: 'fas fa-sitemap', label: 'configuration.sites' },
          { tabToOpen: 'departments', icon: 'fas fa-users', label: 'configuration.departments' },
          { tabToOpen: 'persons', icon: 'fas fa-user', label: 'configuration.persons' },
          { tabToOpen: 'support-groups', icon: 'fas fa-user-friends', label: 'configuration.supportGroups' },
          { tabToOpen: 'roles', icon: 'fas fa-user-shield', label: 'configuration.roles' },
          { tabToOpen: 'task-status', icon: 'fas fa-tasks', label: 'configuration.taskStatus' },
          { tabToOpen: 'task-types', icon: 'fas fa-ticket-alt', label: 'configuration.taskTypes' },
          { tabToOpen: 'workflows', icon: 'fas fa-project-diagram', label: 'configuration.workflows' }*/
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
              { tabToOpen: 'deployed-applications', icon: 'fas fa-rocket', label: 'dataPane.applications.deployed', class: null },
              { tabToOpen: 'applications', icon: 'fas fa-cube', label: 'dataPane.applications.application', class: null },
              { tabToOpen: 'virtual-client', icon: 'fas fa-desktop', label: 'dataPane.applications.virtualClient', class: null }
            ]
          },
          {
            id: 'hardware',
            label: 'dataPane.hardware.title',
            items: [
              { tabToOpen: 'hardware', icon: 'fas fa-microchip', label: 'dataPane.hardware.hardware', class: null },
              { tabToOpen: 'deployed-hardware', icon: 'fas fa-server', label: 'dataPane.hardware.deployedHardware', class: null },
              { tabToOpen: 'workstation', icon: 'fas fa-desktop', label: 'dataPane.hardware.workstation', class: null },
              { tabToOpen: 'server', icon: 'fas fa-server', label: 'dataPane.hardware.server', class: null },
              { tabToOpen: 'storage', icon: 'fas fa-hdd', label: 'dataPane.hardware.storage', class: null },
              { tabToOpen: 'rack', icon: 'fas fa-layer-group', label: 'dataPane.hardware.rack', class: null },
              { tabToOpen: 'ups', icon: 'fas fa-plug', label: 'dataPane.hardware.ups', class: null }
            ]
          },
          {
            id: 'network',
            label: 'dataPane.network.title',
            items: [
              { tabToOpen: 'firewall', icon: 'fas fa-shield-alt', label: 'dataPane.network.firewall', class: null },
              { tabToOpen: 'switch', icon: 'fas fa-network-wired', label: 'dataPane.network.switch', class: null },
              { tabToOpen: 'router', icon: 'fas fa-wifi', label: 'dataPane.network.router', class: null },
              { tabToOpen: 'routing-rule', icon: 'fas fa-route', label: 'dataPane.network.routingRule', class: null },
              { tabToOpen: 'network-printer', icon: 'fas fa-print', label: 'dataPane.network.printer', class: null },
              { tabToOpen: 'zone-cluster', icon: 'fas fa-project-diagram', label: 'dataPane.network.zoneCluster', class: null }
            ]
          },
          {
            id: 'virtualization',
            label: 'dataPane.virtualization.title',
            items: [
              { tabToOpen: 'virtual-rack-billing', icon: 'fas fa-file-invoice-dollar', label: 'dataPane.virtualization.billing', class: null },
              { tabToOpen: 'farm', icon: 'fas fa-server', label: 'dataPane.virtualization.farm', class: null }
            ]
          },
          {
            id: 'database',
            label: 'dataPane.database.title',
            items: [
              { tabToOpen: 'database-catalog', icon: 'fas fa-database', label: 'dataPane.database.catalog', class: null },
              { tabToOpen: 'database-instance', icon: 'fas fa-database', label: 'dataPane.database.instance', class: null }
            ]
          },
          {
            id: 'contracts',
            label: 'dataPane.contracts.title',
            items: [
              { tabToOpen: 'contract', icon: 'fas fa-file-contract', label: 'dataPane.contracts.contract', class: null },
              { tabToOpen: 'software-license', icon: 'fas fa-key', label: 'dataPane.contracts.license', class: null }
            ]
          },
          {
            id: 'cloud',
            label: 'dataPane.cloud.title',
            items: [
              { tabToOpen: 'cloud-service', icon: 'fas fa-cloud-upload-alt', label: 'dataPane.cloud.service', class: null }
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
