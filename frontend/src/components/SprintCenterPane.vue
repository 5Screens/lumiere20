<template>
  <div 
    class="sprint-center-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    ref="sprintCenterPane"
  >
    <div class="sprint-center-header">
      <h2>{{ $t('sprintCenter.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="sprint-center-content">
      <div class="sprint-center-item">
        <router-link to="/tickets">
          <i class="fas fa-ticket-alt"></i>
          {{ $t('sprintCenter.tickets') }}
        </router-link>
      </div>
      <div class="sprint-center-item">
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
.sprint-center-pane {
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

.sprint-center-pane.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.sprint-center-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sprint-center-header h2 {
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

.sprint-center-content {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sprint-center-item {
  margin-bottom: 0.5rem;
}

.sprint-center-item a {
  color: var(--text-color);
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.sprint-center-item a:hover {
  background-color: var(--hover-color);
}

.sprint-center-item a.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.sprint-center-item i {
  margin-right: 0.75rem;
}
</style>
