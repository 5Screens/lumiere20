<template>
  <div class="service-hub-pane" :class="{ 'is-visible': isVisible }">
    <div class="service-hub-header">
      <h2>{{ $t('serviceHub.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="service-hub-content">
      <div class="service-hub-item">
        <router-link to="/incidents">
          <i class="fas fa-exclamation-circle"></i>
          {{ $t('serviceHub.incidents') }}
        </router-link>
      </div>
      <div class="service-hub-item">
        <router-link to="/tickets">
          <i class="fas fa-ticket-alt"></i>
          {{ $t('serviceHub.tickets') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceHubPane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.service-hub-pane {
  position: fixed;
  top: 60px;
  left: 293px;
  width: 250px;
  height: calc(100vh - 60px);
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
  z-index: 100;
  padding: 1rem;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-250px);
}

.service-hub-pane.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.service-hub-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-hub-header h2 {
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

.service-hub-content {
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-hub-item {
  margin-bottom: 0.5rem;
}

.service-hub-item a {
  color: var(--text-color);
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.service-hub-item a:hover {
  background-color: var(--hover-color);
}

.service-hub-item a.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.service-hub-item i {
  margin-right: 0.75rem;
}
</style>
