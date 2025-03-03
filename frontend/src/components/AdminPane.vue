<template>
  <div 
    class="side-pane admin-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="adminPane"
  >
    <div class="side-pane-header admin-header">
      <h2>{{ $t('admin.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="side-pane-content admin-content">
      <div class="side-pane-item admin-item" v-for="(item, index) in adminItems" :key="index">
        <a href="#" @click.prevent="handleItemClick(item)">
          <i :class="item.icon"></i>
          {{ $t(item.label) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminPane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      adminItems: [
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
      ]
    }
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        document.addEventListener('click', this.handleClickOutside)
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    }
  },
  methods: {
    handleClickOutside(event) {
      const toggleButton = document.querySelector('[data-admin-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.adminPane.contains(event.target)) {
        this.$emit('close')
      }
    },
    handleItemClick(item) {
      this.$emit('open-tab', {
        id: item.tabToOpen,
        title: this.$t(item.label),
        type: item.tabToOpen
      })
    }
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
@import '../assets/styles/sidePane.css';

/* Styles spécifiques à ce composant */
.admin-header {
  position: sticky;
  top: 0;
  background-color: var(--sidebar-bg);
  padding: 0.5rem 0;
  z-index: 1;
}
</style>
