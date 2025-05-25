<template>
  <div v-if="visible" class="s-pick-list">
    <!-- Label du composant -->
    <div class="s-pick-list__label-container" v-if="label">
      <label :class="['s-pick-list__label', { 's-pick-list__label--required': required }]">
        {{ label }}
      </label>
    </div>

    <!-- Contenu principal -->
    <div class="s-pick-list__content">
      <!-- Colonne de gauche (source) -->
      <div class="s-pick-list__column">
        <div class="s-pick-list__search-container">
          <input 
            type="text" 
            v-model="sourceSearchQuery" 
            class="s-pick-list__search-input"
            :placeholder="placeholder" 
          />
        </div>
        <div class="s-pick-list__list-container">
          <!-- Loading spinner -->
          <div v-if="sourceLoading" class="s-pick-list__loading">
            <div class="s-pick-list__spinner"></div>
          </div>
          
          <!-- Liste des items disponibles -->
          <ul v-else-if="filteredSourceItems.length > 0" class="s-pick-list__list">
            <li 
              v-for="item in filteredSourceItems" 
              :key="item.uuid"
              :class="[
                's-pick-list__item', 
                { 's-pick-list__item--selected': isSourceItemSelected(item) }
              ]"
              @click="toggleSourceItemSelection(item)"
            >
              <span class="s-pick-list__item-text">{{ getItemLabel(item) }}</span>
            </li>
          </ul>
          
          <!-- Message si aucun item -->
          <div v-else class="s-pick-list__no-items">
            No items available
          </div>
        </div>
      </div>

      <!-- Boutons de contrôle au centre -->
      <div class="s-pick-list__controls">
        <button 
          class="s-pick-list__control-button" 
          :disabled="selectedSourceItems.length === 0"
          @click="moveToTarget"
          title="Move to selected"
        >→</button>
        <button 
          class="s-pick-list__control-button" 
          :disabled="selectedTargetItems.length === 0"
          @click="moveToSource"
          title="Remove from selected"
        >←</button>
      </div>

      <!-- Colonne de droite (target) -->
      <div class="s-pick-list__column">
        <div class="s-pick-list__search-container">
          <input 
            type="text" 
            v-model="targetSearchQuery" 
            class="s-pick-list__search-input"
            :placeholder="placeholder" 
          />
        </div>
        <div class="s-pick-list__list-container">
          <!-- Loading spinner -->
          <div v-if="targetLoading" class="s-pick-list__loading">
            <div class="s-pick-list__spinner"></div>
          </div>
          
          <!-- Liste des items sélectionnés -->
          <ul v-else-if="filteredTargetItems.length > 0" class="s-pick-list__list">
            <li 
              v-for="item in filteredTargetItems" 
              :key="item.uuid"
              :class="[
                's-pick-list__item', 
                { 's-pick-list__item--selected': isTargetItemSelected(item) }
              ]"
              @click="toggleTargetItemSelection(item)"
            >
              <span class="s-pick-list__item-text">{{ getItemLabel(item) }}</span>
            </li>
          </ul>
          
          <!-- Message si aucun item -->
          <div v-else class="s-pick-list__no-items">
            No items selected
          </div>
        </div>
        
        <!-- Footer avec boutons de confirmation/annulation en mode édition -->
        <div v-if="edition && valueChanged" class="s-pick-list__footer">
          <RgButton
            @confirm="confirmChanges"
            @cancel="cancelChanges"
          />
        </div>
      </div>
    </div>

    <!-- Message d'erreur ou d'aide -->
    <span v-if="error" class="s-pick-list__error">{{ error }}</span>
    <span v-else-if="helperText" class="s-pick-list__helper">{{ helperText }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import apiService from '@/services/apiService';
import RgButton from './rgButton.vue';
import '@/assets/styles/sPickList.css';

// Props
const props = defineProps({
  // Contrôle de la visibilité du composant
  visible: {
    type: Boolean,
    default: true
  },
  // Label du composant
  label: {
    type: String,
    default: ''
  },
  // Texte d'aide
  helperText: {
    type: String,
    default: ''
  },
  // Si le champ est requis
  required: {
    type: Boolean,
    default: false
  },
  // Mode édition ou création
  edition: {
    type: Boolean,
    default: false
  },
  // Endpoint pour la liste source (gauche)
  sourceEndPoint: {
    type: String,
    required: true
  },
  // Champ à afficher pour chaque item
  displayedLabel: {
    type: String,
    required: true
  },
  // Endpoint pour la liste cible (droite)
  targetEndPoint: {
    type: String,
    default: null
  },
  // UUID de l'objet cible (pour mode édition)
  target_uuid: {
    type: String,
    default: null
  },
  // Liste des UUIDs déjà sélectionnés
  pickedItems: {
    type: Array,
    default: () => []
  },
  // Valeur du modèle (v-model)
  modelValue: {
    type: Array,
    default: () => []
  },
  // Texte de placeholder pour les champs de recherche
  placeholder: {
    type: String,
    default: 'Search...'
  }
});

// Emits
const emit = defineEmits(['update:modelValue', 'update:success', 'update:error']);

// État du composant
const sourceItems = ref([]);
const targetItems = ref([]);
const originalTargetItems = ref([]);
const selectedSourceItems = ref([]);
const selectedTargetItems = ref([]);
const sourceSearchQuery = ref('');
const targetSearchQuery = ref('');
const sourceLoading = ref(false);
const targetLoading = ref(false);
const error = ref('');
const valueChanged = ref(false);

// Computed properties
const filteredSourceItems = computed(() => {
  if (!sourceSearchQuery.value) return sourceItems.value;
  
  const query = sourceSearchQuery.value.toLowerCase();
  return sourceItems.value.filter(item => {
    const label = getItemLabel(item).toLowerCase();
    return label.includes(query);
  });
});

const filteredTargetItems = computed(() => {
  if (!targetSearchQuery.value) return targetItems.value;
  
  const query = targetSearchQuery.value.toLowerCase();
  return targetItems.value.filter(item => {
    const label = getItemLabel(item).toLowerCase();
    return label.includes(query);
  });
});

// Méthodes
function getItemLabel(item) {
  return item[props.displayedLabel] || 'Unnamed';
}

function isSourceItemSelected(item) {
  return selectedSourceItems.value.includes(item);
}

function isTargetItemSelected(item) {
  return selectedTargetItems.value.includes(item);
}

function toggleSourceItemSelection(item) {
  const index = selectedSourceItems.value.indexOf(item);
  if (index === -1) {
    selectedSourceItems.value.push(item);
  } else {
    selectedSourceItems.value.splice(index, 1);
  }
}

function toggleTargetItemSelection(item) {
  const index = selectedTargetItems.value.indexOf(item);
  if (index === -1) {
    selectedTargetItems.value.push(item);
  } else {
    selectedTargetItems.value.splice(index, 1);
  }
}

function moveToTarget() {
  if (selectedSourceItems.value.length === 0) return;
  
  // Ajouter les items sélectionnés à la liste cible
  targetItems.value = [...targetItems.value, ...selectedSourceItems.value];
  
  // Retirer les items sélectionnés de la liste source
  sourceItems.value = sourceItems.value.filter(
    item => !selectedSourceItems.value.includes(item)
  );
  
  // Mettre à jour le v-model
  updateModelValue();
  
  // Réinitialiser la sélection
  selectedSourceItems.value = [];
  
  // Marquer comme modifié
  checkForChanges();
}

function moveToSource() {
  if (selectedTargetItems.value.length === 0) return;
  
  // Ajouter les items sélectionnés à la liste source
  sourceItems.value = [...sourceItems.value, ...selectedTargetItems.value];
  
  // Retirer les items sélectionnés de la liste cible
  targetItems.value = targetItems.value.filter(
    item => !selectedTargetItems.value.includes(item)
  );
  
  // Mettre à jour le v-model
  updateModelValue();
  
  // Réinitialiser la sélection
  selectedTargetItems.value = [];
  
  // Marquer comme modifié
  checkForChanges();
}

function updateModelValue() {
  emit('update:modelValue', targetItems.value);
}

function checkForChanges() {
  const currentUuids = targetItems.value.map(item => item.uuid).sort();
  const originalUuids = originalTargetItems.value.map(item => item.uuid).sort();
  
  // Vérifier si les listes sont différentes
  valueChanged.value = false;
  
  if (currentUuids.length !== originalUuids.length) {
    valueChanged.value = true;
    return;
  }
  
  for (let i = 0; i < currentUuids.length; i++) {
    if (currentUuids[i] !== originalUuids[i]) {
      valueChanged.value = true;
      return;
    }
  }
}

async function fetchSourceItems() {
  sourceLoading.value = true;
  error.value = '';
  
  try {
    const response = await apiService.get(props.sourceEndPoint);
    
    // Filtrer les items qui sont déjà dans la liste cible
    const targetUuids = targetItems.value.map(item => item.uuid);
    sourceItems.value = response.filter(item => !targetUuids.includes(item.uuid));
  } catch (err) {
    console.error('Error fetching source items:', err);
    error.value = `Failed to load available items: ${err.message}`;
  } finally {
    sourceLoading.value = false;
  }
}

async function loadTargetItems() {
  // Cette fonction est appelée uniquement en mode édition
  targetLoading.value = true;
  error.value = '';
  
  try {
    // 1. Initialiser avec modelValue s'ils sont disponibles
    if (props.modelValue && props.modelValue.length > 0) {
      // Utiliser directement les objets du modelValue s'ils sont disponibles
      const modelUuids = new Set(props.modelValue.map(item => item.uuid));
      targetItems.value = props.modelValue;
      originalTargetItems.value = [...props.modelValue];
      
      // 3. Retirer ces items de la liste source
      sourceItems.value = sourceItems.value.filter(item => !modelUuids.has(item.uuid));
    } 
    // 2. Fallback sur les pickedItems sinon
    else if (props.pickedItems && props.pickedItems.length > 0) {
      // Fallback sur pickedItems si modelValue n'est pas disponible
      const pickedUuids = new Set(props.pickedItems);
      targetItems.value = sourceItems.value.filter(item => pickedUuids.has(item.uuid));
      originalTargetItems.value = [...targetItems.value];
      
      // 3. Retirer ces items de la liste source
      sourceItems.value = sourceItems.value.filter(item => !pickedUuids.has(item.uuid));
    }
  } catch (err) {
    console.error('Error loading target items:', err);
    error.value = `Failed to load selected items: ${err.message}`;
  } finally {
    targetLoading.value = false;
  }
}

async function confirmChanges() {
  if (!props.edition || !props.targetEndPoint || !props.target_uuid) {
    // En mode création, juste mettre à jour le modèle
    updateModelValue();
    valueChanged.value = false;
    return;
  }
  
  error.value = '';
  targetLoading.value = true;
  
  try {
    // 1. Construire la liste des items ajoutés
    const currentUuids = new Set(targetItems.value.map(item => item.uuid));
    const originalUuids = new Set(originalTargetItems.value.map(item => item.uuid));
    
    const addedItems = targetItems.value.filter(item => !originalUuids.has(item.uuid));
    const removedItems = originalTargetItems.value.filter(item => !currentUuids.has(item.uuid));
    
    // 2. Pour chaque item ajouté, faire un appel POST
    const addPromises = addedItems.map(item => 
      apiService.post(`${props.targetEndPoint}/${props.target_uuid}/watchlist`, item.uuid)
    );
    
    // 3. Pour chaque item retiré, faire un appel DELETE
    const removePromises = removedItems.map(item => 
      apiService.delete(`${props.targetEndPoint}/${props.target_uuid}/watchlist`, { data: item.uuid })
    );
    
    // Attendre que toutes les opérations soient terminées
    await Promise.all([...addPromises, ...removePromises]);
    
    // Mettre à jour les items originaux
    originalTargetItems.value = [...targetItems.value];
    valueChanged.value = false;
    
    // Émettre l'événement de succès avec les objets complets
    emit('update:success', {
      success: true,
      fieldName: props.fieldName || 'items',
      value: targetItems.value,
      error: null
    });
  } catch (err) {
    console.error('Error updating watchlist:', err);
    error.value = `Failed to update selected items: ${err.message}`;
    emit('update:error', err.message);
    emit('update:success', {
      success: false,
      fieldName: props.fieldName || 'items',
      value: null,
      error: err.message
    });
  } finally {
    targetLoading.value = false;
  }
}

function cancelChanges() {
  // Restaurer l'état original
  targetItems.value = [...originalTargetItems.value];
  
  // Recalculer la liste source
  const targetUuids = new Set(targetItems.value.map(item => item.uuid));
  sourceItems.value = sourceItems.value.filter(item => !targetUuids.has(item.uuid));
  
  // Réinitialiser les sélections
  selectedSourceItems.value = [];
  selectedTargetItems.value = [];
  
  // Réinitialiser l'état de modification
  valueChanged.value = false;
  
  // Mettre à jour le modèle
  updateModelValue();
}

// Initialisation
onMounted(async () => {
  // Charger les items source
  await fetchSourceItems();
  
  // Charger les items cible uniquement en mode édition
  if (props.edition) {
    await loadTargetItems();
  }
  
  // Initialiser le modèle
  updateModelValue();
});

//Marc 18/05 - Supprimer les surveillances suivantes car elles sont gérées par le composant parent (je crois :) 
// Surveiller les changements de props
/*watch(() => props.pickedItems, async () => {
  if (!props.edition) {
    await fetchSourceItems();
    await fetchTargetItems();
    updateModelValue();
  }
}, { deep: true });

watch(() => props.modelValue, (newValue) => {
  if (newValue && !valueChanged.value) {
    // Si le modèle change de l'extérieur et qu'on n'a pas de modifications en cours
    const modelUuids = new Set(newValue.map(item => item.uuid));
    
    // Mettre à jour targetItems en fonction du nouveau modèle
    const newTargetItems = [];
    const newSourceItems = [];
    
    // Répartir les items entre source et target
    [...sourceItems.value, ...targetItems.value].forEach(item => {
      if (modelUuids.has(item.uuid)) {
        // Utiliser l'objet complet du modelValue si disponible
        const modelItem = newValue.find(modelItem => modelItem.uuid === item.uuid);
        newTargetItems.push(modelItem || item);
      } else {
        newSourceItems.push(item);
      }
    });
    
    sourceItems.value = newSourceItems;
    targetItems.value = newTargetItems;
    originalTargetItems.value = [...newTargetItems];
  }
}, { deep: true });*/
</script>
