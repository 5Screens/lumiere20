<template>
  <div 
    class="dynamic-tooltip-menu" 
    :class="{ 'is-visible': isVisible }"
    :style="positionStyle"
    @click.stop
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Section 1: Titre du module -->
    <div class="tooltip-header">
      <div class="tooltip-title">
        <i :class="titleIcon" class="title-icon"></i>
        <h3>{{ $t(`${paneType}.title`) }}</h3>
      </div>
    </div>
    
    <!-- Section 2: Description du module -->
    <div class="tooltip-description">
      <p>{{ $t(`${paneType}.description`) }}</p>
    </div>
    
    <!-- Section 3: Liste des sous-menus -->
    <div class="tooltip-content">
      <!-- Contenu simple (pour Admin, Configuration, ServiceHub, SprintCenter) -->
      <div v-if="!hasSections" class="tooltip-items">
        <div 
          class="tooltip-item" 
          v-for="(item, index) in items" 
          :key="index"
          @click="handleItemClick(item)"
          @mouseenter="handleItemHover(item, $event)"
          @mouseleave="handleItemLeave(item)"
        >
          <div class="item-content">
            <i :class="item.icon" class="item-icon"></i>
            <span class="item-label">{{ $t(item.label) }}</span>
          </div>
        </div>
      </div>
      
      <!-- Contenu avec sections (pour DataPane) -->
      <div v-else class="tooltip-sections">
        <div 
          class="tooltip-section" 
          v-for="(section, sectionIndex) in sections" 
          :key="sectionIndex"
        >
          <div class="section-header">
            <span class="section-title">{{ $t(section.label) }}</span>
          </div>
          <div class="section-items">
            <div 
              class="tooltip-item" 
              v-for="(item, itemIndex) in section.items" 
              :key="itemIndex"
              @click="handleItemClick(item)"
              @mouseenter="handleItemHover(item, $event)"
              @mouseleave="handleItemLeave(item)"
            >
              <div class="item-content">
                <i :class="item.icon" class="item-icon"></i>
                <span class="item-label">{{ $t(item.label) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Tooltip secondaire pour les sections dataPane -->
    <div
      v-if="secondaryTooltip.isVisible"
      class="dynamic-tooltip-menu secondary-tooltip"
      :class="{ 'is-visible': secondaryTooltip.isVisible }"
      :style="{ left: `${secondaryTooltip.position.x}px`, top: `${secondaryTooltip.position.y}px` }"
      @click.stop
      @mouseenter="handleSecondaryMouseEnter"
      @mouseleave="handleSecondaryMouseLeave"
    >
      <!-- Header du tooltip secondaire -->
      <div class="tooltip-header">
        <div class="tooltip-title">
          <i :class="secondaryTooltip.titleIcon" class="title-icon"></i>
          <h3>{{ $t(`dataPane.${secondaryTooltip.paneType}.title`) }}</h3>
        </div>
      </div>
      
      <!-- Contenu du tooltip secondaire -->
      <div class="tooltip-content">
        <div class="tooltip-items">
          <div 
            class="tooltip-item" 
            v-for="(item, index) in secondaryTooltip.items" 
            :key="index"
            @click="handleItemClick(item)"
          >
            <div class="item-content">
              <i :class="item.icon" class="item-icon"></i>
              <span class="item-label">{{ $t(item.label) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'DynamicToolTipMenu',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    paneType: {
      type: String,
      required: true
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
    },
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    titleIcon: {
      type: String,
      default: 'fas fa-cube'
    }
  },
  emits: ['item-click', 'mouse-enter', 'mouse-leave'],
  setup(props, { emit }) {
    const secondaryTooltip = ref({
      isVisible: false,
      paneType: '',
      items: [],
      sections: [],
      hasSections: false,
      position: { x: 0, y: 0 },
      titleIcon: ''
    })
    
    const positionStyle = computed(() => {
      return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`
      }
    })
    
    const handleMouseEnter = () => {
      emit('mouse-enter')
    }
    
    const handleMouseLeave = () => {
      emit('mouse-leave')
    }
    
    const handleItemClick = (item) => {
      emit('item-click', item)
    }
    
    const handleItemHover = (item, event) => {
      // Si c'est un item de dataPane avec des sections, afficher le tooltip secondaire
      if (props.paneType === 'dataPane' && props.hasSections) {
        const rect = event.target.getBoundingClientRect()
        const section = props.sections.find(s => s.items.includes(item))
        
        if (section) {
          secondaryTooltip.value = {
            isVisible: true,
            paneType: section.id,
            items: section.items,
            sections: [],
            hasSections: false,
            position: {
              x: rect.right + 10,
              y: rect.top
            },
            titleIcon: 'fas fa-cube'
          }
        }
      }
    }
    
    const handleItemLeave = (item) => {
      // Délai avant de masquer le tooltip secondaire
      setTimeout(() => {
        if (!secondaryTooltip.value.mouseOver) {
          secondaryTooltip.value.isVisible = false
        }
      }, 100)
    }
    
    const handleSecondaryMouseEnter = () => {
      secondaryTooltip.value.mouseOver = true
    }
    
    const handleSecondaryMouseLeave = () => {
      secondaryTooltip.value.mouseOver = false
      secondaryTooltip.value.isVisible = false
    }
    
    return {
      secondaryTooltip,
      positionStyle,
      handleMouseEnter,
      handleMouseLeave,
      handleItemClick,
      handleItemHover,
      handleItemLeave,
      handleSecondaryMouseEnter,
      handleSecondaryMouseLeave
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/dynamicToolTipMenu.css';
</style>
