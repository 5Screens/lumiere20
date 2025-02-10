<template>
  <div 
    class="admin-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="adminPane"
  >
    <div class="admin-header">
      <h2>{{ $t('admin.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="admin-content">
      <div class="admin-item">
        <router-link to="/admin/mail-servers">
          <i class="fas fa-mail-bulk"></i>
          {{ $t('admin.mailServers') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/email-notifications">
          <i class="fas fa-envelope"></i>
          {{ $t('admin.emailNotifications') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/sms-notifications">
          <i class="fas fa-sms"></i>
          {{ $t('admin.smsNotifications') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/authentication">
          <i class="fas fa-shield-alt"></i>
          {{ $t('admin.authentication') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/ssl-certificates">
          <i class="fas fa-certificate"></i>
          {{ $t('admin.sslCertificates') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/mfa">
          <i class="fas fa-key"></i>
          {{ $t('admin.mfa') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/ip-restrictions">
          <i class="fas fa-network-wired"></i>
          {{ $t('admin.ipRestrictions') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/audit-logs">
          <i class="fas fa-history"></i>
          {{ $t('admin.auditLogs') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/api-tokens">
          <i class="fas fa-key"></i>
          {{ $t('admin.apiTokens') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/connectors">
          <i class="fas fa-plug"></i>
          {{ $t('admin.connectors') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/performance">
          <i class="fas fa-tachometer-alt"></i>
          {{ $t('admin.performance') }}
        </router-link>
      </div>
      <div class="admin-item">
        <router-link to="/admin/backup">
          <i class="fas fa-database"></i>
          {{ $t('admin.backup') }}
        </router-link>
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
    }
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
.admin-pane {
  position: fixed;
  top: 60px;
  left: 293px;
  width: 250px;
  height: calc(100vh - 120px);
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
  z-index: 100;
  padding: 1rem;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-250px);
  overflow-y: auto;
}

.admin-pane.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.admin-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: var(--sidebar-bg);
  padding: 0.5rem 0;
  z-index: 1;
}

.admin-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-color);
}

.close-button {
  background: transparent;
  border: none;
  color: var(--text-color);
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
}

.close-button:hover {
  background-color: var(--hover-color);
}

.admin-content {
  list-style: none;
  padding: 0;
  margin: 0;
}

.admin-item {
  margin-bottom: 0.5rem;
}

.admin-item a {
  color: var(--text-color);
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.admin-item a:hover {
  background-color: var(--hover-color);
}

.admin-item a.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.admin-item i {
  margin-right: 0.75rem;
  width: 1.25rem;
  text-align: center;
}
</style>
