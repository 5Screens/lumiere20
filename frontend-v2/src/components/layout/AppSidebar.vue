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
  {
    label: t('menu.dashboard') || 'Dashboard',
    icon: 'pi pi-home',
    command: () => openTab('dashboard', 'Dashboard', 'menu.dashboard', 'pi pi-home', 'dashboard', 'Dashboard')
  },
  {
    label: t('menu.configuration') || 'Configuration',
    icon: 'pi pi-cog',
    items: [
      {
        label: t('menu.configurationItems') || 'Configuration Items',
        icon: 'pi pi-box',
        command: () => openTab('configuration-items', 'Configuration Items', 'menu.configurationItems', 'pi pi-box', 'configuration_items')
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
        label: t('menu.groups') || 'Groups',
        icon: 'pi pi-users',
        command: () => openTab('groups', 'Groups', 'menu.groups', 'pi pi-users', 'groups')
      },
      {
        label: t('menu.persons') || 'Persons',
        icon: 'pi pi-user',
        command: () => openTab('persons', 'Persons', 'menu.persons', 'pi pi-user', 'persons')
      },
      {
        label: t('menu.ciTypes') || 'CI Types',
        icon: 'pi pi-tags',
        command: () => openTab('ci-types', 'CI Types', 'menu.ciTypes', 'pi pi-tags', 'ci_types')
      },
      {
        label: t('menu.languages') || 'Languages',
        icon: 'pi pi-globe',
        command: () => openTab('languages', 'Languages', 'menu.languages', 'pi pi-globe', 'languages', 'LanguagesCrud')
      }
    ]
  },
  {
    label: t('menu.tickets') || 'Tickets',
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
        label: t('menu.changes') || 'Changes',
        icon: 'pi pi-sync',
        command: () => openTab('changes', 'Changes', 'menu.changes', 'pi pi-sync', 'changes')
      }
    ]
  },
  {
    label: t('menu.services') || 'Services',
    icon: 'pi pi-server',
    items: [
      {
        label: t('menu.serviceCatalog') || 'Service Catalog',
        icon: 'pi pi-list',
        command: () => openTab('services', 'Services', 'menu.serviceCatalog', 'pi pi-list', 'services')
      },
      {
        label: t('menu.serviceOfferings') || 'Service Offerings',
        icon: 'pi pi-gift',
        command: () => openTab('service-offerings', 'Service Offerings', 'menu.serviceOfferings', 'pi pi-gift', 'service_offerings')
      }
    ]
  },
  {
    label: t('menu.admin') || 'Administration',
    icon: 'pi pi-shield',
    items: [
      {
        label: t('menu.ticketTypes') || 'Ticket Types',
        icon: 'pi pi-tags',
        command: () => openTab('ticket-types', 'Ticket Types', 'menu.ticketTypes', 'pi pi-tags', 'ticket_types')
      },
      {
        label: t('menu.ticketStatus') || 'Ticket Status',
        icon: 'pi pi-flag',
        command: () => openTab('ticket-status', 'Ticket Status', 'menu.ticketStatus', 'pi pi-flag', 'ticket_status')
      },
      {
        label: t('menu.symptoms') || 'Symptoms',
        icon: 'pi pi-info-circle',
        command: () => openTab('symptoms', 'Symptoms', 'menu.symptoms', 'pi pi-info-circle', 'symptoms')
      },
      {
        label: t('menu.metadata') || 'Metadata',
        icon: 'pi pi-database',
        command: () => openTab('metadata-object-types', 'Metadata', 'menu.metadata', 'pi pi-database', 'metadata', 'MetadataObjectTypesCrud')
      }
    ]
  }
])

// Flat menu for collapsed view
const flatMenuItems = computed(() => [
  { label: 'Dashboard', icon: 'pi pi-home', command: () => openTab('dashboard', 'Dashboard', 'menu.dashboard', 'pi pi-home', 'dashboard', 'Dashboard') },
  { label: 'Configuration', icon: 'pi pi-cog', command: () => openTab('configuration-items', 'Configuration Items', 'menu.configurationItems', 'pi pi-box', 'configuration_items') },
  { label: 'Tickets', icon: 'pi pi-ticket', command: () => openTab('incidents', 'Incidents', 'menu.incidents', 'pi pi-exclamation-triangle', 'incidents') },
  { label: 'Services', icon: 'pi pi-server', command: () => openTab('services', 'Services', 'menu.serviceCatalog', 'pi pi-list', 'services') },
  { label: 'Admin', icon: 'pi pi-shield', command: () => openTab('ticket-types', 'Ticket Types', 'menu.ticketTypes', 'pi pi-tags', 'ticket_types') }
])
</script>

<style scoped>
:deep(.p-panelmenu) {
  border: none;
  background: transparent;
}

:deep(.p-panelmenu-panel) {
  border: none;
}

:deep(.p-panelmenu-header-content) {
  border: none;
  border-radius: 0.5rem;
}

:deep(.p-panelmenu-content) {
  border: none;
  background: transparent;
}
</style>
