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
          @click="item.command ? item.command() : navigateTo(item.to)"
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
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PanelMenu from 'primevue/panelmenu'
import Button from 'primevue/button'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-collapse'])

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const navigateTo = (path) => {
  if (path) router.push(path)
}

const menuItems = computed(() => [
  {
    label: t('menu.dashboard') || 'Dashboard',
    icon: 'pi pi-home',
    command: () => navigateTo('/')
  },
  {
    label: t('menu.configuration') || 'Configuration',
    icon: 'pi pi-cog',
    items: [
      {
        label: t('menu.configurationItems') || 'Configuration Items',
        icon: 'pi pi-box',
        command: () => navigateTo('/configuration-items')
      },
      {
        label: t('menu.entities') || 'Entities',
        icon: 'pi pi-building',
        command: () => navigateTo('/entities')
      },
      {
        label: t('menu.locations') || 'Locations',
        icon: 'pi pi-map-marker',
        command: () => navigateTo('/locations')
      },
      {
        label: t('menu.groups') || 'Groups',
        icon: 'pi pi-users',
        command: () => navigateTo('/groups')
      },
      {
        label: t('menu.persons') || 'Persons',
        icon: 'pi pi-user',
        command: () => navigateTo('/persons')
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
        command: () => navigateTo('/tickets/incidents')
      },
      {
        label: t('menu.problems') || 'Problems',
        icon: 'pi pi-question-circle',
        command: () => navigateTo('/tickets/problems')
      },
      {
        label: t('menu.changes') || 'Changes',
        icon: 'pi pi-sync',
        command: () => navigateTo('/tickets/changes')
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
        command: () => navigateTo('/services')
      },
      {
        label: t('menu.serviceOfferings') || 'Service Offerings',
        icon: 'pi pi-gift',
        command: () => navigateTo('/service-offerings')
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
        command: () => navigateTo('/admin/ticket-types')
      },
      {
        label: t('menu.ticketStatus') || 'Ticket Status',
        icon: 'pi pi-flag',
        command: () => navigateTo('/admin/ticket-status')
      },
      {
        label: t('menu.symptoms') || 'Symptoms',
        icon: 'pi pi-info-circle',
        command: () => navigateTo('/admin/symptoms')
      }
    ]
  }
])

// Flat menu for collapsed view
const flatMenuItems = computed(() => [
  { label: 'Dashboard', icon: 'pi pi-home', to: '/' },
  { label: 'Configuration', icon: 'pi pi-cog', to: '/configuration-items' },
  { label: 'Tickets', icon: 'pi pi-ticket', to: '/tickets/incidents' },
  { label: 'Services', icon: 'pi pi-server', to: '/services' },
  { label: 'Admin', icon: 'pi pi-shield', to: '/admin/ticket-types' }
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
