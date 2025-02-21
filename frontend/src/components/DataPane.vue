<template>
  <div 
    class="data-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="dataPane"
  >
    <div class="data-header">
      <h2>{{ $t('dataPane.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="data-content">
      <!-- Applications -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('applications')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.applications }"></i>
          <span>{{ $t('dataPane.applications.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.applications }">
          <div class="data-item" v-for="item in applicationItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Hardware Infrastructure -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('hardware')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.hardware }"></i>
          <span>{{ $t('dataPane.hardware.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.hardware }">
          <div class="data-item" v-for="item in hardwareItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Network and Communications -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('network')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.network }"></i>
          <span>{{ $t('dataPane.network.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.network }">
          <div class="data-item" v-for="item in networkItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Virtualization -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('virtualization')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.virtualization }"></i>
          <span>{{ $t('dataPane.virtualization.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.virtualization }">
          <div class="data-item" v-for="item in virtualizationItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('database')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.database }"></i>
          <span>{{ $t('dataPane.database.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.database }">
          <div class="data-item" v-for="item in databaseItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Contracts and Licenses -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('contracts')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.contracts }"></i>
          <span>{{ $t('dataPane.contracts.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.contracts }">
          <div class="data-item" v-for="item in contractItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Cloud -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('cloud')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.cloud }"></i>
          <span>{{ $t('dataPane.cloud.title') }}</span>
        </div>
        <div class="data-section-content" :class="{ 'expanded': openSections.cloud }">
          <div class="data-item" v-for="item in cloudItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive } from 'vue'

export default {
  name: 'DataPane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      openSections: reactive({
        applications: false,
        hardware: false,
        network: false,
        virtualization: false,
        database: false,
        contracts: false,
        cloud: false
      }),
      applicationItems: [
        { tabToOpen: 'deployed-applications', icon: 'fas fa-rocket', label: 'dataPane.applications.deployed' },
        { tabToOpen: 'applications', icon: 'fas fa-cube', label: 'dataPane.applications.application' },
        { tabToOpen: 'virtual-client', icon: 'fas fa-desktop', label: 'dataPane.applications.virtualClient' }
      ],
      hardwareItems: [
        { tabToOpen: 'hardware', icon: 'fas fa-microchip', label: 'dataPane.hardware.hardware' },
        { tabToOpen: 'deployed-hardware', icon: 'fas fa-server', label: 'dataPane.hardware.deployedHardware' },
        { tabToOpen: 'workstation', icon: 'fas fa-desktop', label: 'dataPane.hardware.workstation' },
        { tabToOpen: 'server', icon: 'fas fa-server', label: 'dataPane.hardware.server' },
        { tabToOpen: 'storage', icon: 'fas fa-hdd', label: 'dataPane.hardware.storage' },
        { tabToOpen: 'rack', icon: 'fas fa-layer-group', label: 'dataPane.hardware.rack' },
        { tabToOpen: 'ups', icon: 'fas fa-plug', label: 'dataPane.hardware.ups' }
      ],
      networkItems: [
        { tabToOpen: 'firewall', icon: 'fas fa-shield-alt', label: 'dataPane.network.firewall' },
        { tabToOpen: 'switch', icon: 'fas fa-network-wired', label: 'dataPane.network.switch' },
        { tabToOpen: 'router', icon: 'fas fa-wifi', label: 'dataPane.network.router' },
        { tabToOpen: 'routing-rule', icon: 'fas fa-route', label: 'dataPane.network.routingRule' },
        { tabToOpen: 'network-printer', icon: 'fas fa-print', label: 'dataPane.network.printer' },
        { tabToOpen: 'zone-cluster', icon: 'fas fa-project-diagram', label: 'dataPane.network.zoneCluster' }
      ],
      virtualizationItems: [
        { tabToOpen: 'virtual-rack-billing', icon: 'fas fa-file-invoice-dollar', label: 'dataPane.virtualization.billing' },
        { tabToOpen: 'farm', icon: 'fas fa-server', label: 'dataPane.virtualization.farm' }
      ],
      databaseItems: [
        { tabToOpen: 'database-catalog', icon: 'fas fa-database', label: 'dataPane.database.catalog' },
        { tabToOpen: 'database-instance', icon: 'fas fa-database', label: 'dataPane.database.instance' }
      ],
      contractItems: [
        { tabToOpen: 'contract', icon: 'fas fa-file-contract', label: 'dataPane.contracts.contract' },
        { tabToOpen: 'software-license', icon: 'fas fa-key', label: 'dataPane.contracts.softwareLicense' }
      ],
      cloudItems: [
        { tabToOpen: 'cloud-provider', icon: 'fas fa-cloud', label: 'dataPane.cloud.provider' },
        { tabToOpen: 'cloud-service', icon: 'fas fa-cloud-upload-alt', label: 'dataPane.cloud.service' }
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
    toggleSection(section) {
      // Fermer toutes les autres sections
      Object.keys(this.openSections).forEach(key => {
        if (key !== section) {
          this.openSections[key] = false
        }
      })
      // Basculer l'état de la section cliquée
      this.openSections[section] = !this.openSections[section]
    },
    handleClickOutside(event) {
      const toggleButton = document.querySelector('[data-data-pane-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.dataPane.contains(event.target)) {
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
.data-pane {
  position: fixed;
  top: 60px;
  left: 293px;
  width: 300px;
  height: calc(100vh - 120px);
  background-color: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  transition: all 0.3s ease-in-out;
  z-index: 100;
  padding: 1rem;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-300px);
  overflow-y: auto;
}

.data-pane.is-visible {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.data-header {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-header h2 {
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

.data-section {
  margin-bottom: 0.5rem;
}

.data-section-header {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  user-select: none;
}

.data-section-header:hover {
  background-color: var(--hover-color);
}

.data-section-header i {
  margin-right: 0.75rem;
  transition: transform 0.3s ease;
  width: 12px;
}

.data-section-header i.rotated {
  transform: rotate(90deg);
}

.data-section-content {
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: all 0.3s ease-out;
}

.data-section-content.expanded {
  max-height: 500px;
  opacity: 1;
}

.data-item {
  margin: 0.25rem 0;
  padding-left: 1.5rem;
}

.data-item a {
  color: var(--text-color);
  text-decoration: none;
  display: block;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.data-item a:hover {
  background-color: var(--hover-color);
}

.data-item a.router-link-active {
  background-color: var(--primary-color);
  color: white;
}

.data-item i {
  margin-right: 0.75rem;
  width: 1rem;
  text-align: center;
}
</style>
