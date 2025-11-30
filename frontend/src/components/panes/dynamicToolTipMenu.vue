<template>
  <div 
    class="dynamic-tooltip-menu" 
    :class="{ 'is-visible': isVisible }"
    :style="positionStyle"
    @click.stop
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Triangle pointant vers le menu appelant -->
    <div class="tooltip-arrow" :style="arrowStyle"></div>
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
    arrowY: {
      type: Number,
      default: 0
    },
    titleIcon: {
      type: String,
      default: 'fas fa-cube'
    }
  },
  emits: ['item-click', 'mouse-enter', 'mouse-leave'],
  setup(props, { emit }) {
    const positionStyle = computed(() => {
      return {
        left: `${props.position.x}px`,
        top: `${props.position.y}px`
      }
    })
    
    const arrowStyle = computed(() => {
      // Calculate arrow position relative to tooltip top
      // Subtract 10px to center the arrow (arrow height is 20px total)
      const arrowOffset = props.arrowY - props.position.y - 10
      return {
        top: `${Math.max(12, arrowOffset)}px`
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
      // Reserved for future use
    }
    
    const handleItemLeave = (item) => {
      // Reserved for future use
    }
    
    return {
      positionStyle,
      arrowStyle,
      handleMouseEnter,
      handleMouseLeave,
      handleItemClick,
      handleItemHover,
      handleItemLeave
    }
  }
}
</script>

<style scoped>
@import '@/assets/styles/dynamicToolTipMenu.css';
</style>
