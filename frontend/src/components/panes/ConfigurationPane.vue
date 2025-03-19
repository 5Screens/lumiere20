<template>
  <!--
    A component that renders a pane on the right side of the screen, containing
    items that can be clicked to configure the application. When the pane is
    closed, the "close" event is emitted.

    Props:
      isVisible: A boolean indicating whether the pane should be visible or not.

    Events:
      close: Emitted when the pane is closed.
      mouse-enter: Emitted when the mouse enters the pane.
      mouse-leave: Emitted when the mouse leaves the pane.
  -->
  <div 
    class="side-pane configuration-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="configurationPane"
  >
    <!--
      A header for the configuration pane, containing the title of the pane
      and a button to close the pane.
    -->
    <div class="side-pane-header configuration-header">
      <h2>{{ $t('configuration.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <!--
      A container for the configuration items. Each configuration item is
      rendered as a link with an icon and a label. When the link is clicked,
      the handleItemClick method is called with the item as an argument.
    -->
    <div class="side-pane-content configuration-content">
      <div class="side-pane-item configuration-item" v-for="(item, index) in configItems" :key="index">
        <a href="#" @click.prevent="handleItemClick(item)">
          <i :class="item.icon"></i>
          {{ $t(item.label) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'

export default {
  name: 'ConfigurationPane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const store = useTabsStore()
    return { store }
  },
  data() {
    return {
      configItems: [
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
      ]
    }
  },
  methods: {
    handleItemClick(item) {
      this.store.openTab({
        id: item.tabToOpen,
        label: this.$t(item.label),
        type: item.tabToOpen
      })
    }
  }
}
</script>

<style scoped>
@import '../../assets/styles/sidePane.css';

/* Styles spécifiques à ce composant */
.configuration-content {
  overflow-y: auto;
  height: calc(100% - 3rem);
}
</style>
