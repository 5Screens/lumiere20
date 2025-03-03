<template>
  <div 
    class="side-pane sprint-center-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="sprintCenterPane"
  >
    <div class="side-pane-header sprint-center-header">
      <h2>{{ $t('sprintCenter.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="side-pane-content sprint-center-content">
      <div class="side-pane-item sprint-center-item">
        <router-link to="/tickets">
          <i class="fas fa-ticket-alt"></i>
          {{ $t('sprintCenter.tickets') }}
        </router-link>
      </div>
      <div class="side-pane-item sprint-center-item">
        <router-link to="/user-stories">
          <i class="fas fa-book"></i>
          {{ $t('sprintCenter.userStories') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SprintCenterPane',
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
      const toggleButton = document.querySelector('[data-sprint-center-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.sprintCenterPane.contains(event.target)) {
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
