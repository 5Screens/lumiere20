<template>
  <div 
    class="side-pane service-hub-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="serviceHubPane"
  >
    <div class="side-pane-header service-hub-header">
      <h2>{{ $t('serviceHub.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="side-pane-content service-hub-content">
      <div class="side-pane-item service-hub-item">
        <router-link to="/incidents">
          <i class="fas fa-exclamation-circle"></i>
          {{ $t('serviceHub.incidents') }}
        </router-link>
      </div>
      <div class="side-pane-item service-hub-item">
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
      // Vérifier si le clic est sur le bouton toggle du ServiceHub
      const toggleButton = document.querySelector('[data-service-hub-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.serviceHubPane.contains(event.target)) {
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
@import '../assets/styles/sidePane.css';

</style>
