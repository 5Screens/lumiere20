<template>
  <div class="s-relations-explorer">
    <h2 class="s-relations-explorer__title">Relation explorer</h2>
    
    <!-- Mode création -->
    <div v-if="mode === 'creation'" class="s-relations-explorer__message">
      Objet not yet created : none relation to display !
    </div>
    
    <!-- Mode édition -->
    <div v-else-if="mode === 'edition'">
      <!-- Affichage du chargement -->
      <div v-if="loading" class="s-relations-explorer__loading">
        <div class="s-relations-explorer__spinner"></div>
      </div>
      
      <!-- Affichage de l'erreur -->
      <div v-else-if="error" class="s-relations-explorer__error">
        {{ error }}
      </div>
      
      <!-- Contenu principal -->
      <div v-else class="s-relations-explorer__content">
        <!-- Objet source (à gauche) -->
        <div class="s-relations-explorer__source">
          <div class="s-relations-explorer__source-title">{{ objectType }}</div>
          <div class="s-relations-explorer__source-uuid">{{ objectUuid }}</div>
        </div>
        
        <!-- Zone des connexions (au milieu) -->
        <div class="s-relations-explorer__connections">
          <svg class="s-relations-explorer__svg-container" ref="svgContainer" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path 
              v-for="(curve, index) in bezierCurves" 
              :key="index"
              :d="curve.path"
              :stroke="curve.color"
              class="bezier-curve"
            />
          </svg>
        </div>
        
        <!-- Objets liés (à droite) -->
        <div class="s-relations-explorer__targets" ref="targetsContainer">
          <div 
            v-for="(target, index) in targetObjects" 
            :key="index"
            class="s-relations-explorer__target"
            :ref="el => { if (el) targetRefs[index] = el }"
          >
            <div class="s-relations-explorer__target-title">
              <span>{{ formatObjectName(target.key) }}</span>
              <span class="s-relations-explorer__target-count">{{ target.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import apiService from '@/services/apiService';
import '@/assets/styles/sRelationsExplorer.css';

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  objectUuid: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    default: 'creation',
    validator: (value) => ['creation', 'edition'].includes(value)
  }
});

// Component state
const loading = ref(false);
const error = ref('');
const relationsData = ref(null);
const svgContainer = ref(null);
const targetsContainer = ref(null);
const targetRefs = ref([]);
const bezierCurves = ref([]);

// Colors for the curves
const curveColors = [
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#FFC107', // Amber
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#FF5722'  // Deep Orange
];

// Computed properties
const targetObjects = computed(() => {
  if (!relationsData.value || !relationsData.value.relations_count) {
    return [];
  }
  
  return Object.entries(relationsData.value.relations_count)
    .map(([key, count]) => ({ key, count }));
});

// Methods
const fetchRelationsCount = async () => {
  if (props.mode !== 'edition' || !props.objectType || !props.objectUuid) {
    return;
  }
  
  loading.value = true;
  error.value = '';
  
  try {
    const endpoint = `${props.objectType}/${props.objectUuid}/relations/count`;
    const data = await apiService.get(endpoint);
    relationsData.value = data;
    console.info('[Relations Explorer] Data fetched successfully:', data);
  } catch (err) {
    console.error('[Relations Explorer] Error fetching relations count:', err);
    error.value = `Error loading relations: ${err.message}`;
  } finally {
    loading.value = false;
  }
};

const formatObjectName = (name) => {
  // Convert snake_case to Title Case
  return name
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const calculateBezierCurves = () => {
  if (!svgContainer.value || !targetsContainer.value || targetRefs.value.length === 0) {
    return;
  }
  
  const svgRect = svgContainer.value.getBoundingClientRect();
  
  // Utiliser des valeurs normalisées pour le SVG (0-100)
  const sourceX = 0; // Gauche du SVG
  const sourceY = 50; // Milieu du SVG
  const targetX = 100; // Droite du SVG
  
  // Calculer les points cibles et créer les courbes de Bézier
  const curves = [];
  const totalTargets = targetRefs.value.length;
  
  targetRefs.value.forEach((target, index) => {
    if (!target) return;
    
    // Calculer la position Y en fonction du nombre pair/impair de cibles
    let targetY;
    
    if (totalTargets % 2 === 0) { // Nombre pair de cibles
      const halfCount = totalTargets / 2;
      if (index < halfCount) {
        // Moitié supérieure
        const position = halfCount - index - 1;
        targetY = sourceY - (position + 1) * (100 / (halfCount + 1));
      } else {
        // Moitié inférieure
        const position = index - halfCount;
        targetY = sourceY + (position + 1) * (100 / (halfCount + 1));
      }
    } else { // Nombre impair de cibles
      const halfCount = Math.floor(totalTargets / 2);
      if (index < halfCount) {
        // Moitié supérieure
        const position = halfCount - index - 1;
        targetY = sourceY - (position + 1) * (100 / (halfCount + 1));
      } else if (index === halfCount) {
        // Milieu (directement en face)
        targetY = sourceY;
      } else {
        // Moitié inférieure
        const position = index - halfCount - 1;
        targetY = sourceY + (position + 1) * (100 / (halfCount + 1));
      }
    }
    
    // Créer une courbe de Bézier cubique
    // Les points de contrôle sont définis pour créer une belle courbe
    const controlPoint1X = sourceX + 30; // 30% de la largeur du SVG
    const controlPoint1Y = sourceY;
    const controlPoint2X = targetX - 30; // 30% de la largeur du SVG depuis la droite
    const controlPoint2Y = targetY;
    
    const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;
    
    // Assigner une couleur de notre tableau de couleurs
    const colorIndex = index % curveColors.length;
    
    curves.push({
      path,
      color: curveColors[colorIndex]
    });
  });
  
  bezierCurves.value = curves;
  console.info('[Relations Explorer] Bezier curves calculated:', curves);
};

// Lifecycle hooks
onMounted(() => {
  fetchRelationsCount();
});

// Watch for changes in props
watch(() => props.objectUuid, fetchRelationsCount);
watch(() => props.objectType, fetchRelationsCount);
watch(() => props.mode, fetchRelationsCount);

// Watch for changes in data that should trigger recalculation of curves
watch(targetObjects, () => {
  // Wait for DOM update before calculating curves
  setTimeout(() => {
    calculateBezierCurves();
  }, 0);
});

// Watch for changes in the refs to recalculate curves
watch(targetRefs, () => {
  setTimeout(() => {
    calculateBezierCurves();
  }, 0);
});

// Window resize handler
let resizeTimeout;
const handleResize = () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    calculateBezierCurves();
  }, 200);
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
  
  // Initial calculation after component is mounted and data is loaded
  setTimeout(() => {
    calculateBezierCurves();
  }, 100);
});

// Clean up event listeners
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});
</script>
