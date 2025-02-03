<template>
  <div 
    class="configuration-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    ref="configurationPane"
  >
    <div class="configuration-header">
      <h2>{{ $t('configuration.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="configuration-content">
      <div class="configuration-item" v-for="(item, index) in configItems" :key="index">
        <a href="#" @click.prevent="handleItemClick(item)">
          <i :class="item.icon"></i>
          {{ $t(item.label) }}
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'ConfigurationPane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      configItems: [
        { route: '/companies', icon: 'fas fa-building', label: 'configuration.companies' },
        { route: '/locations', icon: 'fas fa-map-marker-alt', label: 'configuration.locations' },
        { route: '/sites', icon: 'fas fa-sitemap', label: 'configuration.sites' },
        { route: '/entities', icon: 'fas fa-cube', label: 'configuration.entities' },
        { route: '/departments', icon: 'fas fa-users', label: 'configuration.departments' },
        { route: '/persons', icon: 'fas fa-user', label: 'configuration.persons' },
        { route: '/support-groups', icon: 'fas fa-user-friends', label: 'configuration.supportGroups' },
        { route: '/roles', icon: 'fas fa-user-shield', label: 'configuration.roles' },
        { route: '/ticket-status', icon: 'fas fa-tasks', label: 'configuration.ticketStatus' },
        { route: '/symptoms', icon: 'fas fa-stethoscope', label: 'configuration.symptoms' },
        { route: '/ticket-types', icon: 'fas fa-ticket-alt', label: 'configuration.ticketTypes' },
        { route: '/workflows', icon: 'fas fa-project-diagram', label: 'configuration.workflows' }
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
    async handleItemClick(item) {
      if (item.route === '/symptoms') {
        try {
          const locale = this.$i18n.locale || 'fr'
          const response = await axios.get(`http://localhost:3000/api/v1/symptoms?langue=${locale}`)
          
          this.$emit('open-tab', {
            id: 'symptoms',
            title: this.$t('configuration.symptoms'),
            data: response.data || [],
            type: 'symptoms'
          })
        } catch (error) {
          console.error('Erreur lors de la récupération des symptômes:', error)
          this.$toast.error(this.$t('errors.fetchSymptoms'))
        }
        return
      }
      this.$router.push(item.route)
    },
    
    async handleSymptomsClick() {
      try {
        const locale = this.$i18n.locale || 'fr'
        const response = await axios.get(`http://localhost:3000/api/v1/symptoms?langue=${locale}`)
        
        this.$emit('open-tab', {
          id: 'symptoms',
          title: this.$t('configuration.symptoms'),
          data: response.data,
          type: 'symptoms'
        })
      } catch (error) {
        console.error('Erreur lors de la récupération des symptômes:', error)
        this.$toast.error(this.$t('errors.fetchSymptoms'))
      }
    },
    
    handleClickOutside(event) {
      const toggleButton = document.querySelector('[data-configuration-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.configurationPane.contains(event.target)) {
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
.configuration-pane {
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

.configuration-pane.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.configuration-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.configuration-header h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: normal;
}

.close-button {
  background: none;
  border: none;
  color: var(--text-color);
  cursor: pointer;
  padding: 0.5rem;
}

.close-button:hover {
  color: var(--primary-color);
}

.configuration-content {
  overflow-y: auto;
  height: calc(100% - 3rem);
}

.configuration-item {
  margin-bottom: 0.5rem;
}

.configuration-item a {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  color: var(--text-color);
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.configuration-item a:hover {
  background-color: var(--hover-bg);
}

.configuration-item i {
  margin-right: 0.5rem;
  width: 20px;
  text-align: center;
}
</style>
