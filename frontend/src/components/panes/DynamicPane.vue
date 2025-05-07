<template>
  <div 
    class="side-pane" 
    :class="[`${type}-pane`, { 'is-visible': isVisible }]" 
    :style="{ display: isVisible ? 'block' : 'none' }"
    @click.stop
    @mouseenter="$emit('mouse-enter', type)"
    @mouseleave="$emit('mouse-leave', type)"
    ref="paneRef"
  >
    <div class="side-pane-header" :class="`${type}-header`">
      <h2>{{ $t(`${type}.title`) }}</h2>
      <button class="close-button" @click="$emit('close', type)">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <!-- Message En cours de construction -->
    <div v-if="type === 'underConstruction'" class="side-pane-content under-construction-content">
      <div class="under-construction-message">
        <i class="fas fa-hard-hat"></i>
        <p>En cours de construction...</p>
      </div>
    </div>
    
    <!-- Contenu simple (pour Admin, Configuration, ServiceHub, SprintCenter) -->
    <div v-else-if="!hasSections" class="side-pane-content" :class="`${type}-content`">
      <div 
        class="side-pane-item" 
        :class="`${type}-item`" 
        v-for="(item, index) in items" 
        :key="index"
      >
        <!-- Lien pour ouvrir un onglet -->
        <a href="#" @click.prevent="handleItemClick(item)">
          <i :class="item.icon"></i>
          {{ $t(item.label) }}
        </a>
      </div>
    </div>
    
    <!-- Contenu avec sections (pour DataPane) -->
    <div v-else :class="`${type}-content`">
      <div 
        class="side-pane-section" 
        :class="`${type}-section`" 
        v-for="(section, sectionIndex) in sections" 
        :key="sectionIndex"
      >
        <div 
          class="side-pane-section-header" 
          :class="`${type}-section-header`" 
          @click="toggleSection(section.id)"
        >
          <i 
            class="fas fa-chevron-right" 
            :class="{ 'rotated': openSections[section.id] }"
          ></i>
          <span>{{ $t(section.label) }}</span>
        </div>
        <div 
          class="side-pane-section-content" 
          :class="[`${type}-section-content`, { 'expanded': openSections[section.id] }]"
        >
          <div 
            class="side-pane-item" 
            :class="`${type}-item`" 
            v-for="(item, itemIndex) in section.items" 
            :key="itemIndex"
          >
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
import { reactive, ref } from 'vue'
import { useTabsStore } from '@/stores/tabsStore'

export default {
  name: 'DynamicPane',
  props: {
    type: {
      type: String,
      required: true,
      validator: (value) => ['admin', 'configuration', 'dataPane', 'serviceHub', 'sprintCenter', 'underConstruction'].includes(value)
    },
    isVisible: {
      type: Boolean,
      default: false
    },
    items: {
      type: Array,
      default: () => []
    },
    sections: {
      type: Array,
      default: () => []
    },
    hasSections: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'mouse-enter', 'mouse-leave', 'open-tab'],
  setup(props) {
    const store = useTabsStore()
    const paneRef = ref(null)
    const openSections = reactive({})
    const justOpened = ref(false)
    
    // Initialiser les sections fermées
    if (props.sections) {
      props.sections.forEach(section => {
        openSections[section.id] = false
      })
    }
    
    return { 
      store, 
      paneRef,
      openSections,
      justOpened
    }
  },
  mounted() {
    console.log(`DynamicPane ${this.type} monté avec isVisible =`, this.isVisible);
  },
  watch: {
    isVisible(newValue) {
      console.log(`DynamicPane ${this.type} - isVisible changé à:`, newValue);
      if (newValue) {
        // Marquer le panneau comme venant d'être ouvert pour éviter la fermeture immédiate
        this.justOpened = true;
        document.addEventListener('click', this.handleClickOutside)
      } else {
        document.removeEventListener('click', this.handleClickOutside)
      }
    }
  },
  methods: {
    handleClickOutside(event) {
      // Ne pas traiter l'événement immédiatement après l'ouverture du panneau
      // Cela évite que le même clic qui ouvre le panneau ne le ferme immédiatement
      if (this.justOpened) {
        this.justOpened = false;
        return;
      }

      const toggleButton = document.querySelector(`[data-${this.type}-toggle]`)
      if (toggleButton && toggleButton.contains(event.target)) {
        return
      }
      
      if (this.isVisible && this.$refs.paneRef && !this.$refs.paneRef.contains(event.target)) {
        console.log(`Fermeture du panneau ${this.type} par clic extérieur`);
        this.$emit('close', this.type)
      }
    },
    handleItemClick(item) {
      // Ouvrir un onglet via le store ou émettre un événement
      if (this.store) {
        this.store.openTab({
          id: item.tabToOpen,
          label: item.label,
          type: item.tabToOpen,
          icon: item.icon
        })
      } else {
        this.$emit('open-tab', {
          id: item.tabToOpen,
          title: this.$t(item.label),
          type: item.tabToOpen
        })
      }
    },
    toggleSection(sectionId) {
      this.openSections[sectionId] = !this.openSections[sectionId]
    }
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside)
  }
}
</script>

<style scoped>
@import '../../assets/styles/sidePane.css';

/* Styles pour le message En cours de construction */
.under-construction-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 2rem;
}

.under-construction-message {
  text-align: center;
  padding: 2rem;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.under-construction-message i {
  font-size: 3rem;
  color: var(--accent-color);
  margin-bottom: 1rem;
}

.under-construction-message p {
  font-size: 1.2rem;
  font-weight: 500;
  color: var(--text-primary);
}

/* Animation pour l'apparition du panneau */
.side-pane.is-visible {
  animation: panelAppear 0.3s ease-in-out;
}

@keyframes panelAppear {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
