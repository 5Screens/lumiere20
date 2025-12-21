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
import { computed, ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabsStore } from '@/stores/tabsStore'
import PanelMenu from 'primevue/panelmenu'
import Button from 'primevue/button'
import api from '@/services/api'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-collapse'])

const { t, locale } = useI18n()
const tabsStore = useTabsStore()

// Dynamic CI categories and types
const ciCategories = ref([])
const uncategorizedCiTypes = ref([])
const isLoadingCategories = ref(false)

/**
 * Load CI categories with their CI types from API
 */
const loadCiCategories = async () => {
  isLoadingCategories.value = true
  try {
    const [categoriesResponse, uncategorizedResponse] = await Promise.all([
      api.get('/ci_categories/with-ci-types'),
      api.get('/ci_categories/uncategorized')
    ])
    ciCategories.value = categoriesResponse.data
    uncategorizedCiTypes.value = uncategorizedResponse.data
  } catch (error) {
    console.error('Failed to load CI categories:', error)
  } finally {
    isLoadingCategories.value = false
  }
}

// Load categories on mount and when locale changes
onMounted(() => {
  loadCiCategories()
})

watch(locale, () => {
  loadCiCategories()
})

/**
 * Opens a tab for the given object type
 */
const openTab = (id, label, labelKey, icon, objectType, component = 'ObjectsCrud', ciTypeUuid = null, ticketTypeCode = null) => {
  console.log('[AppSidebar] openTab called:', { id, label, objectType, component, ciTypeUuid, ticketTypeCode })
  tabsStore.openTab({
    id,
    label,
    labelKey,
    icon,
    objectType,
    component,
    ciTypeUuid,
    ticketTypeCode
  })
}

/**
 * Build the Assets & Data menu dynamically from CI categories
 */
const buildAssetsDataMenu = () => {
  const items = []
  
  // 1. All Configuration Items (always first, static)
  items.push({
    label: t('menu.allConfigurationItems') || 'All Configuration Items',
    icon: 'pi pi-box',
    command: () => openTab('configuration-items', 'All Configuration Items', 'menu.allConfigurationItems', 'pi pi-box', 'configuration_items', 'ObjectsCrud')
  })
  
  // 2. Dynamic categories with their CI types
  for (const category of ciCategories.value) {
    if (category.ci_types && category.ci_types.length > 0) {
      items.push({
        label: category.label,
        icon: `pi ${category.icon || 'pi-folder'}`,
        items: category.ci_types.map(ciType => ({
          label: ciType.label,
          icon: `pi ${ciType.icon || 'pi-box'}`,
          command: () => openTab(
            `ci-type-${ciType.code.toLowerCase()}`,
            ciType.label,
            null, // No i18n key, using dynamic label
            `pi ${ciType.icon || 'pi-box'}`,
            'configuration_items', // Always use configuration_items
            'ObjectsCrud',
            ciType.uuid // Pass ciTypeUuid for filtering
          )
        }))
      })
    }
  }
  
  // 3. Others section for uncategorized CI types
  if (uncategorizedCiTypes.value.length > 0) {
    items.push({
      label: t('menu.sections.others') || 'Others',
      icon: 'pi pi-ellipsis-h',
      items: uncategorizedCiTypes.value.map(ciType => ({
        label: ciType.label,
        icon: `pi ${ciType.icon || 'pi-box'}`,
        command: () => openTab(
          `ci-type-${ciType.code.toLowerCase()}`,
          ciType.label,
          null,
          `pi ${ciType.icon || 'pi-box'}`,
          'configuration_items',
          'ObjectsCrud',
          ciType.uuid
        )
      }))
    })
  }
  
  return items
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
        command: () => openTab('incidents', 'Incidents', 'menu.incidents', 'pi pi-exclamation-triangle', 'tickets', 'ObjectsCrud', null, 'INCIDENT')
      },
      {
        label: t('menu.problems') || 'Problems',
        icon: 'pi pi-question-circle',
        command: () => openTab('problems', 'Problems', 'menu.problems', 'pi pi-question-circle', 'tickets', 'ObjectsCrud', null, 'PROBLEM')
      },
      {
        label: t('menu.tasks') || 'Tasks',
        icon: 'pi pi-check-square',
        command: () => openTab('tasks', 'Tasks', 'menu.tasks', 'pi pi-check-square', 'tickets', 'ObjectsCrud', null, 'TASK')
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
        command: () => openTab('projects', 'Projects', 'menu.projects', 'pi pi-folder', 'tickets', 'ObjectsCrud', null, 'PROJECT')
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
  // 5. Assets & Data (dynamic from CI categories)
  {
    label: t('menu.assetsData') || 'Assets & Data',
    icon: 'pi pi-database',
    items: buildAssetsDataMenu()
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
            label: t('menu.ciCategories') || 'CI Categories',
            icon: 'pi pi-folder',
            command: () => openTab('ci-categories', 'CI Categories', 'menu.ciCategories', 'pi pi-folder', 'ci_categories', 'ObjectsCrud')
          },
          {
            label: t('menu.ciTypes') || 'CI Types',
            icon: 'pi pi-tags',
            command: () => openTab('ci-types', 'CI Types', 'menu.ciTypes', 'pi pi-tags', 'ci_types', 'ObjectsCrud')
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
      // Section: Workflow
      {
        label: 'Workflow',
        icon: 'pi pi-sitemap',
        items: [
          {
            label: t('workflow.statusCategories') || 'Status Categories',
            icon: 'pi pi-palette',
            command: () => openTab('workflow-status-categories', 'Status Categories', 'workflow.statusCategories', 'pi pi-palette', 'workflow_status_categories', 'WorkflowStatusCategoriesCrud')
          },
          {
            label: t('workflow.manageWorkflows') || 'Manage Workflows',
            icon: 'pi pi-sitemap',
            command: () => openTab('workflows', 'Workflows', 'workflow.manageWorkflows', 'pi pi-sitemap', 'workflows', 'WorkflowsList')
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
          },
          {
            label: t('menu.ticketTypes') || 'Ticket Types',
            icon: 'pi pi-ticket',
            command: () => openTab('ticket-types', 'Ticket Types', 'menu.ticketTypes', 'pi pi-ticket', 'ticket_types')
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
  { label: t('menu.assetsData'), icon: 'pi pi-database', command: () => openTab('configuration-items', 'All Configuration Items', 'menu.allConfigurationItems', 'pi pi-box', 'configuration_items', 'ObjectsCrud') },
  { label: t('menu.tableaux'), icon: 'pi pi-chart-bar', command: () => {} },
  { label: t('menu.configuration'), icon: 'pi pi-cog', command: () => openTab('ci-types', 'CI Types', 'menu.ciTypes', 'pi pi-tags', 'ci_types', 'ObjectsCrud') },
  { label: t('menu.admin'), icon: 'pi pi-shield', command: () => openTab('languages', 'Languages', 'menu.languages', 'pi pi-globe', 'languages', 'LanguagesCrud') }
])
</script>

