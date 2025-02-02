<template>
  <div 
    class="data-pane" 
    :class="{ 'is-visible': isVisible }" 
    @click.stop
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
        <div class="data-section-content" v-show="openSections.applications">
          <div class="data-item">
            <router-link to="/data/deployed-applications">
              <i class="fas fa-rocket"></i>
              {{ $t('dataPane.applications.deployed') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/applications">
              <i class="fas fa-cube"></i>
              {{ $t('dataPane.applications.application') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/virtual-client">
              <i class="fas fa-desktop"></i>
              {{ $t('dataPane.applications.virtualClient') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Hardware Infrastructure -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('hardware')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.hardware }"></i>
          <span>{{ $t('dataPane.hardware.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.hardware">
          <div class="data-item">
            <router-link to="/data/hardware">
              <i class="fas fa-microchip"></i>
              {{ $t('dataPane.hardware.hardware') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/deployed-hardware">
              <i class="fas fa-server"></i>
              {{ $t('dataPane.hardware.deployedHardware') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/workstation">
              <i class="fas fa-desktop"></i>
              {{ $t('dataPane.hardware.workstation') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/server">
              <i class="fas fa-server"></i>
              {{ $t('dataPane.hardware.server') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/storage">
              <i class="fas fa-hdd"></i>
              {{ $t('dataPane.hardware.storage') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/rack">
              <i class="fas fa-layer-group"></i>
              {{ $t('dataPane.hardware.rack') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/ups">
              <i class="fas fa-plug"></i>
              {{ $t('dataPane.hardware.ups') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Network and Communications -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('network')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.network }"></i>
          <span>{{ $t('dataPane.network.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.network">
          <div class="data-item">
            <router-link to="/data/firewall">
              <i class="fas fa-shield-alt"></i>
              {{ $t('dataPane.network.firewall') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/switch">
              <i class="fas fa-network-wired"></i>
              {{ $t('dataPane.network.switch') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/router">
              <i class="fas fa-wifi"></i>
              {{ $t('dataPane.network.router') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/routing-rule">
              <i class="fas fa-route"></i>
              {{ $t('dataPane.network.routingRule') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/network-printer">
              <i class="fas fa-print"></i>
              {{ $t('dataPane.network.printer') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/zone-cluster">
              <i class="fas fa-project-diagram"></i>
              {{ $t('dataPane.network.zoneCluster') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Virtualization -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('virtualization')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.virtualization }"></i>
          <span>{{ $t('dataPane.virtualization.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.virtualization">
          <div class="data-item">
            <router-link to="/data/virtual-rack-billing">
              <i class="fas fa-file-invoice-dollar"></i>
              {{ $t('dataPane.virtualization.billing') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/farm">
              <i class="fas fa-server"></i>
              {{ $t('dataPane.virtualization.farm') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Database -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('database')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.database }"></i>
          <span>{{ $t('dataPane.database.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.database">
          <div class="data-item">
            <router-link to="/data/database-catalog">
              <i class="fas fa-database"></i>
              {{ $t('dataPane.database.catalog') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/database-instance">
              <i class="fas fa-database"></i>
              {{ $t('dataPane.database.instance') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Contracts and Licenses -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('contracts')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.contracts }"></i>
          <span>{{ $t('dataPane.contracts.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.contracts">
          <div class="data-item">
            <router-link to="/data/contract">
              <i class="fas fa-file-contract"></i>
              {{ $t('dataPane.contracts.contract') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/software-license">
              <i class="fas fa-key"></i>
              {{ $t('dataPane.contracts.license') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/software-counter">
              <i class="fas fa-calculator"></i>
              {{ $t('dataPane.contracts.counter') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- User Device -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('userDevice')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.userDevice }"></i>
          <span>{{ $t('dataPane.userDevice.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.userDevice">
          <div class="data-item">
            <router-link to="/data/mobile">
              <i class="fas fa-mobile-alt"></i>
              {{ $t('dataPane.userDevice.mobile') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/laptop">
              <i class="fas fa-laptop"></i>
              {{ $t('dataPane.userDevice.laptop') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/user-printer">
              <i class="fas fa-print"></i>
              {{ $t('dataPane.userDevice.printer') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Cloud Infrastructure -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('cloud')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.cloud }"></i>
          <span>{{ $t('dataPane.cloud.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.cloud">
          <div class="data-item">
            <router-link to="/data/virtual-machine">
              <i class="fas fa-cloud"></i>
              {{ $t('dataPane.cloud.vm') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/cloud-service">
              <i class="fas fa-cloud-upload-alt"></i>
              {{ $t('dataPane.cloud.service') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/cloud-storage">
              <i class="fas fa-cloud-download-alt"></i>
              {{ $t('dataPane.cloud.storage') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Containerization -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('container')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.container }"></i>
          <span>{{ $t('dataPane.container.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.container">
          <div class="data-item">
            <router-link to="/data/container">
              <i class="fas fa-box"></i>
              {{ $t('dataPane.container.container') }}
            </router-link>
          </div>
        </div>
      </div>

      <!-- Security -->
      <div class="data-section">
        <div class="data-section-header" @click="toggleSection('security')">
          <i class="fas fa-chevron-right" :class="{ 'rotated': openSections.security }"></i>
          <span>{{ $t('dataPane.security.title') }}</span>
        </div>
        <div class="data-section-content" v-show="openSections.security">
          <div class="data-item">
            <router-link to="/data/antivirus">
              <i class="fas fa-virus-slash"></i>
              {{ $t('dataPane.security.antivirus') }}
            </router-link>
          </div>
          <div class="data-item">
            <router-link to="/data/endpoint-protection">
              <i class="fas fa-shield-virus"></i>
              {{ $t('dataPane.security.endpoint') }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
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
      openSections: {
        applications: false,
        hardware: false,
        network: false,
        virtualization: false,
        database: false,
        contracts: false,
        userDevice: false,
        cloud: false,
        container: false,
        security: false
      }
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
      this.$set(this.openSections, section, !this.openSections[section])
    },
    handleClickOutside(event) {
      const toggleButton = document.querySelector('[data-data-pane-toggle]')
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && !this.$refs.dataPane.contains(event.target)) {
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
.data-pane {
  position: fixed;
  top: 60px;
  left: 293px;
  width: 300px;
  height: calc(100vh - 60px);
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
}

.data-section-header:hover {
  background-color: var(--hover-color);
}

.data-section-header i {
  margin-right: 0.75rem;
  transition: transform 0.2s;
}

.data-section-header i.rotated {
  transform: rotate(90deg);
}

.data-section-content {
  padding-left: 1.5rem;
}

.data-item {
  margin: 0.25rem 0;
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
