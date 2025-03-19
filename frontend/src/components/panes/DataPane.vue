<template>
  <div 
    class="side-pane data-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
    @mouseenter="$emit('mouse-enter')"
    @mouseleave="$emit('mouse-leave')"
    ref="dataPane"
  >
    <div class="side-pane-header data-header">
      <h2>{{ $t('dataPane.title') }}</h2>
      <button class="close-button" @click="$emit('close')">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="data-content">
      <!-- Applications -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('applications')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.applications }"></i>
          <span>{{ $t('dataPane.applications.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.applications }">
          <div class="side-pane-item data-item" v-for="item in applicationItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Hardware Infrastructure -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('hardware')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.hardware }"></i>
          <span>{{ $t('dataPane.hardware.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.hardware }">
          <div class="side-pane-item data-item" v-for="item in hardwareItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Network and Communications -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('network')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.network }"></i>
          <span>{{ $t('dataPane.network.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.network }">
          <div class="side-pane-item data-item" v-for="item in networkItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Virtualization -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('virtualization')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.virtualization }"></i>
          <span>{{ $t('dataPane.virtualization.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.virtualization }">
          <div class="side-pane-item data-item" v-for="item in virtualizationItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('database')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.database }"></i>
          <span>{{ $t('dataPane.database.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.database }">
          <div class="side-pane-item data-item" v-for="item in databaseItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Contracts and Licenses -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('contracts')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.contracts }"></i>
          <span>{{ $t('dataPane.contracts.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.contracts }">
          <div class="side-pane-item data-item" v-for="item in contractItems" :key="item.tabToOpen">
            <a href="#" @click.prevent="handleItemClick(item)">
              <i :class="item.icon"></i>
              {{ $t(item.label) }}
            </a>
          </div>
        </div>
      </div>

      <!-- Cloud -->
      <div class="side-pane-section data-section">
        <div class="side-pane-section-header data-section-header" @click="toggleSection('cloud')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.cloud }"></i>
          <span>{{ $t('dataPane.cloud.title') }}</span>
        </div>
        <div class="side-pane-section-content data-section-content" :class="{ 'expanded': openSections.cloud }">
          <div class="side-pane-item data-item" v-for="item in cloudItems" :key="item.tabToOpen">
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
  emits: ['close', 'mouse-enter', 'mouse-leave', 'open-tab'],
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
        { tabToOpen: 'software-license', icon: 'fas fa-key', label: 'dataPane.contracts.license' }
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
@import '../../assets/styles/sidePane.css';

/* Styles spécifiques à ce composant */
.data-pane {
  width: 300px;
  transform: translateX(-300px);
}

.data-content {
  overflow-y: auto;
}
</style>
