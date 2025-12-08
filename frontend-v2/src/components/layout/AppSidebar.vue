<template>
  <aside 
    class="h-full bg-surface-0 border-r border-surface-200 transition-all duration-300 flex flex-col"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Menu -->
    <div class="flex-1 overflow-y-auto py-2">
      <PanelMenu 
        v-if="!collapsed"
        :model="menuItems" 
        class="w-full border-none"
        :pt="{
          root: { class: 'border-none bg-transparent' },
          panel: { class: 'border-none' },
          headerContent: { class: 'border-none rounded-lg' }
        }"
      />
      
      <!-- Collapsed menu (icons only) -->
      <div v-else class="flex flex-col items-center gap-1 px-2">
        <Button 
          v-for="item in flatMenuItems" 
          :key="item.label"
          :icon="item.icon" 
          severity="secondary" 
          text 
          rounded
          class="w-12 h-12"
          @click="item.command()"
          v-tooltip.right="item.label"
        />
      </div>
    </div>

    <!-- Collapse toggle -->
    <div class="p-2 border-t border-surface-200">
      <Button 
        :icon="collapsed ? 'pi pi-angle-right' : 'pi pi-angle-left'" 
        severity="secondary" 
        text 
        class="w-full"
        @click="$emit('toggle-collapse')"
      />
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabsStore } from '@/stores/tabsStore'
import PanelMenu from 'primevue/panelmenu'
import Button from 'primevue/button'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-collapse'])

const { t } = useI18n()
const tabsStore = useTabsStore()

/**
 * Opens a tab for the given object type
 */
const openTab = (id, label, labelKey, icon, objectType, component = 'ObjectsCrud') => {
  tabsStore.openTab({
    id,
    label,
    labelKey,
    icon,
    objectType,
    component
  })
}

const menuItems = computed(() => [
  // 1. Service Hub
  {
    label: t('menu.serviceHub') || 'Service Hub',
    icon: 'pi pi-ticket',
    items: [
      {
        label: t('menu.incidents') || 'Incidents',
        icon: 'pi pi-exclamation-triangle',
        command: () => openTab('incidents', 'Incidents', 'menu.incidents', 'pi pi-exclamation-triangle', 'incidents')
      },
      {
        label: t('menu.problems') || 'Problems',
        icon: 'pi pi-question-circle',
        command: () => openTab('problems', 'Problems', 'menu.problems', 'pi pi-question-circle', 'problems')
      },
      {
        label: t('menu.tasks') || 'Tasks',
        icon: 'pi pi-check-square',
        command: () => openTab('tasks', 'Tasks', 'menu.tasks', 'pi pi-check-square', 'tasks')
      },
      {
        label: t('menu.changes') || 'Changes',
        icon: 'pi pi-sync',
        command: () => openTab('changes', 'Changes', 'menu.changes', 'pi pi-sync', 'changes')
      },
      {
        label: t('menu.knowledge') || 'Knowledge',
        icon: 'pi pi-book',
        command: () => openTab('knowledge', 'Knowledge', 'menu.knowledge', 'pi pi-book', 'knowledge')
      }
    ]
  },
  // 2. Sprint Center
  {
    label: t('menu.sprintCenter') || 'Sprint Center',
    icon: 'pi pi-bolt',
    items: [
      {
        label: t('menu.sprintTasks') || 'Tasks',
        icon: 'pi pi-check-square',
        command: () => openTab('sprint-tasks', 'Tasks', 'menu.sprintTasks', 'pi pi-check-square', 'sprint_tasks')
      },
      {
        label: t('menu.userStories') || 'User Stories',
        icon: 'pi pi-file',
        command: () => openTab('user-stories', 'User Stories', 'menu.userStories', 'pi pi-file', 'user_stories')
      },
      {
        label: t('menu.projects') || 'Projects',
        icon: 'pi pi-folder',
        command: () => openTab('projects', 'Projects', 'menu.projects', 'pi pi-folder', 'projects')
      },
      {
        label: t('menu.sprints') || 'Sprints',
        icon: 'pi pi-bolt',
        command: () => openTab('sprints', 'Sprints', 'menu.sprints', 'pi pi-bolt', 'sprints')
      },
      {
        label: t('menu.epics') || 'Epics',
        icon: 'pi pi-bookmark',
        command: () => openTab('epics', 'Epics', 'menu.epics', 'pi pi-bookmark', 'epics')
      },
      {
        label: t('menu.defects') || 'Defects',
        icon: 'pi pi-exclamation-circle',
        command: () => openTab('defects', 'Defects', 'menu.defects', 'pi pi-exclamation-circle', 'defects')
      }
    ]
  },
  // 3. Mail (empty)
  {
    label: t('menu.mail') || 'Mail',
    icon: 'pi pi-envelope',
    items: []
  },
  // 4. Portals Builder
  {
    label: t('menu.portalsBuilder') || 'Portals Builder',
    icon: 'pi pi-globe',
    items: [
      {
        label: t('menu.portals') || 'Portals',
        icon: 'pi pi-globe',
        command: () => openTab('portals', 'Portals', 'menu.portals', 'pi pi-globe', 'portals')
      }
    ]
  },
  // 5. Assets & Data
  {
    label: t('menu.assetsData') || 'Assets & Data',
    icon: 'pi pi-database',
    items: [
      // All Configuration Items (no section)
      {
        label: t('menu.allConfigurationItems') || 'All Configuration Items',
        icon: 'pi pi-box',
        command: () => openTab('configuration-items', 'All Configuration Items', 'menu.allConfigurationItems', 'pi pi-box', 'configuration_items', 'ConfigurationItemsCrud')
      },
      // Section: Applications (collapsible)
      {
        label: t('menu.sections.applications') || 'Applications',
        icon: 'pi pi-th-large',
        items: [
          {
            label: t('menu.applications') || 'Applications',
            icon: 'pi pi-th-large',
            command: () => openTab('applications', 'Applications', 'menu.applications', 'pi pi-th-large', 'applications')
          },
          {
            label: t('menu.virtualClient') || 'Virtual Client',
            icon: 'pi pi-desktop',
            command: () => openTab('virtual-client', 'Virtual Client', 'menu.virtualClient', 'pi pi-desktop', 'virtual_client')
          }
        ]
      },
      // Section: Hardware (collapsible)
      {
        label: t('menu.sections.hardware') || 'Hardware',
        icon: 'pi pi-microchip',
        items: [
          {
            label: t('menu.hardware') || 'Hardware',
            icon: 'pi pi-microchip',
            command: () => openTab('hardware', 'Hardware', 'menu.hardware', 'pi pi-microchip', 'hardware')
          },
          {
            label: t('menu.workstation') || 'Workstation',
            icon: 'pi pi-desktop',
            command: () => openTab('workstation', 'Workstation', 'menu.workstation', 'pi pi-desktop', 'workstation')
          },
          {
            label: t('menu.server') || 'Server',
            icon: 'pi pi-server',
            command: () => openTab('server', 'Server', 'menu.server', 'pi pi-server', 'server')
          },
          {
            label: t('menu.storage') || 'Storage',
            icon: 'pi pi-database',
            command: () => openTab('storage', 'Storage', 'menu.storage', 'pi pi-database', 'storage')
          },
          {
            label: t('menu.rack') || 'Rack',
            icon: 'pi pi-objects-column',
            command: () => openTab('rack', 'Rack', 'menu.rack', 'pi pi-objects-column', 'rack')
          },
          {
            label: t('menu.ups') || 'UPS',
            icon: 'pi pi-bolt',
            command: () => openTab('ups', 'UPS', 'menu.ups', 'pi pi-bolt', 'ups')
          }
        ]
      },
      // Section: Network (collapsible)
      {
        label: t('menu.sections.network') || 'Network',
        icon: 'pi pi-sitemap',
        items: [
          {
            label: t('menu.firewall') || 'Firewall',
            icon: 'pi pi-shield',
            command: () => openTab('firewall', 'Firewall', 'menu.firewall', 'pi pi-shield', 'firewall')
          },
          {
            label: t('menu.switch') || 'Switch',
            icon: 'pi pi-sitemap',
            command: () => openTab('switch', 'Switch', 'menu.switch', 'pi pi-sitemap', 'switch')
          },
          {
            label: t('menu.router') || 'Router',
            icon: 'pi pi-wifi',
            command: () => openTab('router', 'Router', 'menu.router', 'pi pi-wifi', 'router')
          },
          {
            label: t('menu.routingRule') || 'Routing Rule',
            icon: 'pi pi-directions',
            command: () => openTab('routing-rule', 'Routing Rule', 'menu.routingRule', 'pi pi-directions', 'routing_rule')
          },
          {
            label: t('menu.networkPrinter') || 'Network Printer',
            icon: 'pi pi-print',
            command: () => openTab('network-printer', 'Network Printer', 'menu.networkPrinter', 'pi pi-print', 'network_printer')
          },
          {
            label: t('menu.zoneCluster') || 'Zone Cluster',
            icon: 'pi pi-share-alt',
            command: () => openTab('zone-cluster', 'Zone Cluster', 'menu.zoneCluster', 'pi pi-share-alt', 'zone_cluster')
          }
        ]
      },
      // Section: Virtualization (collapsible)
      {
        label: t('menu.sections.virtualization') || 'Virtualization',
        icon: 'pi pi-server',
        items: [
          {
            label: t('menu.virtualRackBilling') || 'Virtual Rack Billing',
            icon: 'pi pi-dollar',
            command: () => openTab('virtual-rack-billing', 'Virtual Rack Billing', 'menu.virtualRackBilling', 'pi pi-dollar', 'virtual_rack_billing')
          },
          {
            label: t('menu.farm') || 'Farm',
            icon: 'pi pi-server',
            command: () => openTab('farm', 'Farm', 'menu.farm', 'pi pi-server', 'farm')
          }
        ]
      },
      // Section: Database (collapsible)
      {
        label: t('menu.sections.database') || 'Database',
        icon: 'pi pi-database',
        items: [
          {
            label: t('menu.databaseCatalog') || 'Database Catalog',
            icon: 'pi pi-database',
            command: () => openTab('database-catalog', 'Database Catalog', 'menu.databaseCatalog', 'pi pi-database', 'database_catalog')
          },
          {
            label: t('menu.databaseInstance') || 'Database Instance',
            icon: 'pi pi-database',
            command: () => openTab('database-instance', 'Database Instance', 'menu.databaseInstance', 'pi pi-database', 'database_instance')
          }
        ]
      },
      // Section: Contracts (collapsible)
      {
        label: t('menu.sections.contracts') || 'Contracts',
        icon: 'pi pi-file',
        items: [
          {
            label: t('menu.contract') || 'Contract',
            icon: 'pi pi-file',
            command: () => openTab('contract', 'Contract', 'menu.contract', 'pi pi-file', 'contract')
          },
          {
            label: t('menu.softwareLicense') || 'Software License',
            icon: 'pi pi-key',
            command: () => openTab('software-license', 'Software License', 'menu.softwareLicense', 'pi pi-key', 'software_license')
          }
        ]
      },
      // Section: Cloud (collapsible)
      {
        label: t('menu.sections.cloud') || 'Cloud',
        icon: 'pi pi-cloud',
        items: [
          {
            label: t('menu.cloudService') || 'Cloud Service',
            icon: 'pi pi-cloud',
            command: () => openTab('cloud-service', 'Cloud Service', 'menu.cloudService', 'pi pi-cloud', 'cloud_service')
          }
        ]
      }
    ]
  },
  // 6. Tableaux (empty)
  {
    label: t('menu.tableaux') || 'Tableaux',
    icon: 'pi pi-chart-bar',
    items: []
  },
  // 7. Configuration
  {
    label: t('menu.configuration') || 'Configuration',
    icon: 'pi pi-cog',
    items: [
      // Section: Service Management (collapsible)
      {
        label: t('menu.sections.serviceManagement') || 'Service Management',
        icon: 'pi pi-cog',
        items: [
          {
            label: t('menu.ciTypes') || 'CI Types',
            icon: 'pi pi-tags',
            command: () => openTab('ci-types', 'CI Types', 'menu.ciTypes', 'pi pi-tags', 'ci_types', 'CiTypesCrud')
          },
          {
            label: t('menu.changeSetup') || 'Change Setup',
            icon: 'pi pi-cog',
            command: () => openTab('change-setup', 'Change Setup', 'menu.changeSetup', 'pi pi-cog', 'change_setup')
          },
          {
            label: t('menu.changeQuestions') || 'Change Questions',
            icon: 'pi pi-question-circle',
            command: () => openTab('change-questions', 'Change Questions', 'menu.changeQuestions', 'pi pi-question-circle', 'change_questions')
          },
          {
            label: t('menu.changeOptions') || 'Change Options',
            icon: 'pi pi-sliders-h',
            command: () => openTab('change-options', 'Change Options', 'menu.changeOptions', 'pi pi-sliders-h', 'change_options')
          },
          {
            label: t('menu.problemCategories') || 'Problem Categories',
            icon: 'pi pi-tags',
            command: () => openTab('problem-categories', 'Problem Categories', 'menu.problemCategories', 'pi pi-tags', 'problem_categories')
          },
          {
            label: t('menu.incidentSetup') || 'Incident Setup',
            icon: 'pi pi-exclamation-triangle',
            command: () => openTab('incident-setup', 'Incident Setup', 'menu.incidentSetup', 'pi pi-exclamation-triangle', 'incident_setup')
          },
          {
            label: t('menu.symptoms') || 'Symptoms',
            icon: 'pi pi-info-circle',
            command: () => openTab('symptoms', 'Symptoms', 'menu.symptoms', 'pi pi-info-circle', 'symptoms')
          },
          {
            label: t('menu.knowledgeSetup') || 'Knowledge Setup',
            icon: 'pi pi-book',
            command: () => openTab('knowledge-setup', 'Knowledge Setup', 'menu.knowledgeSetup', 'pi pi-book', 'knowledge_setup')
          }
        ]
      },
      // Section: Agile Backlog (collapsible)
      {
        label: t('menu.sections.agileBacklog') || 'Agile Backlog',
        icon: 'pi pi-bolt',
        items: [
          {
            label: t('menu.defectSetup') || 'Defect Setup',
            icon: 'pi pi-exclamation-circle',
            command: () => openTab('defect-setup', 'Defect Setup', 'menu.defectSetup', 'pi pi-exclamation-circle', 'defect_setup')
          },
          {
            label: t('menu.projectSetup') || 'Project Setup',
            icon: 'pi pi-folder',
            command: () => openTab('project-setup', 'Project Setup', 'menu.projectSetup', 'pi pi-folder', 'project_setup')
          }
        ]
      },
      // Section: Foundations (collapsible)
      {
        label: t('menu.sections.foundations') || 'Foundations',
        icon: 'pi pi-building',
        items: [
          {
            label: t('menu.entitySetup') || 'Entity Setup',
            icon: 'pi pi-cog',
            command: () => openTab('entity-setup', 'Entity Setup', 'menu.entitySetup', 'pi pi-cog', 'entity_setup')
          },
          {
            label: t('menu.contactTypes') || 'Contact Types',
            icon: 'pi pi-phone',
            command: () => openTab('contact-types', 'Contact Types', 'menu.contactTypes', 'pi pi-phone', 'contact_types')
          },
          {
            label: t('menu.entities') || 'Entities',
            icon: 'pi pi-building',
            command: () => openTab('entities', 'Entities', 'menu.entities', 'pi pi-building', 'entities')
          },
          {
            label: t('menu.locations') || 'Locations',
            icon: 'pi pi-map-marker',
            command: () => openTab('locations', 'Locations', 'menu.locations', 'pi pi-map-marker', 'locations')
          },
          {
            label: t('menu.persons') || 'Persons',
            icon: 'pi pi-user',
            command: () => openTab('persons', 'Persons', 'menu.persons', 'pi pi-user', 'persons')
          },
          {
            label: t('menu.groups') || 'Groups',
            icon: 'pi pi-users',
            command: () => openTab('groups', 'Groups', 'menu.groups', 'pi pi-users', 'groups')
          }
        ]
      }
    ]
  },
  // 8. Admin
  {
    label: t('menu.admin') || 'Administration',
    icon: 'pi pi-shield',
    items: [
      {
        label: t('menu.languages') || 'Languages',
        icon: 'pi pi-globe',
        command: () => openTab('languages', 'Languages', 'menu.languages', 'pi pi-globe', 'languages', 'LanguagesCrud')
      },
      {
        label: t('menu.metadata') || 'Metadata',
        icon: 'pi pi-database',
        command: () => openTab('metadata-object-types', 'Metadata', 'menu.metadata', 'pi pi-database', 'metadata', 'MetadataObjectTypesCrud')
      },
      {
        label: t('menu.audit') || 'Audit',
        icon: 'pi pi-history',
        command: () => openTab('audit', 'Audit', 'menu.audit', 'pi pi-history', 'audit', 'AuditView')
      }
    ]
  }
])

// Flat menu for collapsed view
const flatMenuItems = computed(() => [
  { label: t('menu.serviceHub'), icon: 'pi pi-ticket', command: () => openTab('incidents', 'Incidents', 'menu.incidents', 'pi pi-exclamation-triangle', 'incidents') },
  { label: t('menu.sprintCenter'), icon: 'pi pi-bolt', command: () => openTab('sprint-tasks', 'Tasks', 'menu.sprintTasks', 'pi pi-check-square', 'sprint_tasks') },
  { label: t('menu.mail'), icon: 'pi pi-envelope', command: () => {} },
  { label: t('menu.portalsBuilder'), icon: 'pi pi-globe', command: () => openTab('portals', 'Portals', 'menu.portals', 'pi pi-globe', 'portals') },
  { label: t('menu.assetsData'), icon: 'pi pi-database', command: () => openTab('configuration-items', 'All Configuration Items', 'menu.allConfigurationItems', 'pi pi-box', 'configuration_items', 'ConfigurationItemsCrud') },
  { label: t('menu.tableaux'), icon: 'pi pi-chart-bar', command: () => {} },
  { label: t('menu.configuration'), icon: 'pi pi-cog', command: () => openTab('ci-types', 'CI Types', 'menu.ciTypes', 'pi pi-tags', 'ci_types', 'CiTypesCrud') },
  { label: t('menu.admin'), icon: 'pi pi-shield', command: () => openTab('languages', 'Languages', 'menu.languages', 'pi pi-globe', 'languages', 'LanguagesCrud') }
])
</script>

