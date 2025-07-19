<template>
  <div 
    :class="[
      's-tags-list', 
      { 's-tags-list--editing': isEditing },
      { 's-tags-list--error': showRequiredError }
    ]"
  >
    <!-- Label du composant avec astérisque si requis -->
    <div class="s-tags-list__label-container" v-if="label">
      <label 
        :class="[
          's-tags-list__label',
          { 's-tags-list__label--required': required }
        ]"
      >
        {{ label }}
      </label>
    </div>
    
    <div class="s-tags-list__content-container">
      <!-- Zone de saisie et d'affichage des tags -->
      <div class="s-tags-list__input-area">
        <!-- Tags sélectionnés -->
        <div class="s-tags-list__tags-container">
          <div 
            v-for="(tag, index) in selectedTags" 
            :key="index" 
            class="s-tags-list__tag"
          >
            <span class="s-tags-list__tag-text">{{ getTagDisplay(tag) }}</span>
            <button 
              type="button" 
              class="s-tags-list__tag-remove" 
              @click="removeTag(index)"
              aria-label="Supprimer ce tag"
            >
              &times;
            </button>
          </div>
        </div>
        
        <!-- Champ de saisie -->
        <input 
          type="text" 
          v-model="inputValue" 
          class="s-tags-list__input" 
          :placeholder="placeholder || ''"
          @keydown.enter.prevent="addTag"
          @focus="showDropdown = comboBox"
          @input="handleInput"
          ref="tagInput"
        />
      </div>
      
      <!-- Boutons d'action en mode édition -->
      <div v-if="edition && valueChanged" class="s-tags-list__actions">
        <RgButton
          @confirm="confirmChanges"
          @cancel="cancelChanges"
        />
      </div>
      
      <!-- Menu déroulant pour le mode comboBox -->
      <div 
        v-if="comboBox && showDropdown" 
        class="s-tags-list__dropdown"
      >
        <!-- Indicateur de chargement -->
        <div v-if="loading" class="s-tags-list__loading">
          <div class="s-tags-list__spinner"></div>
        </div>
        
        <!-- Liste des tags disponibles -->
        <ul v-else-if="filteredOptions.length > 0" class="s-tags-list__options">
          <li 
            v-for="option in filteredOptions" 
            :key="getOptionId(option)"
            class="s-tags-list__option"
            @mousedown.prevent.stop="selectOption(option)"
          >
            {{ getOptionLabel(option) }}
          </li>
        </ul>
        
        <!-- Message si aucun résultat -->
        <div v-else class="s-tags-list__no-results">
          Aucun résultat trouvé
        </div>
      </div>
      
      <!-- Message d'aide ou d'erreur -->
      <span v-if="showRequiredError" class="s-tags-list__error">
        Ce champ est obligatoire
      </span>
      <span v-else-if="helperText" class="s-tags-list__helper">
        {{ helperText }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import apiService from '@/services/apiService'
import RgButton from './rgButton.vue'
import '@/assets/styles/sTagsList.css'

// Props
const props = defineProps({
  // UUID de l'objet lié (utilisé pour le patch en édition)
  uuid: {
    type: String,
    default: ''
  },
  // Libellé affiché au-dessus du champ
  label: {
    type: String,
    required: true
  },
  // Info-bulle ou aide contextuelle sous le champ
  helperText: {
    type: String,
    default: ''
  },
  // Texte d'exemple dans le champ
  placeholder: {
    type: String,
    default: 'Ajouter un tag...'
  },
  // Mode édition (avec rgButton) ou création
  edition: {
    type: Boolean,
    default: false
  },
  // Si true, affiche un menu des tags disponibles à sélectionner
  comboBox: {
    type: Boolean,
    required: true
  },
  // API GET pour récupérer les tags disponibles
  sourceEndPoint: {
    type: String,
    default: ''
  },
  // Nom du champ à afficher parmi les résultats de l'API
  displayedLabel: {
    type: String,
    default: 'name'
  },
  // Nom de l'attribut lié dans objectStore
  fieldName: {
    type: String,
    required: true
  },
  // Si true, bordure rouge et astérisque sur le label
  required: {
    type: Boolean,
    default: false
  },
  // Valeur du modèle (v-model)
  modelValue: {
    type: Array,
    default: () => []
  },
  // Endpoint pour le PATCH en mode édition
  patchEndpoint: {
    type: String,
    default: ''
  },
  // Attribut à envoyer au serveur au lieu de l'objet complet
  attributeSentToServer: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:success', 'update:error'])

// État local
const inputValue = ref('')
const selectedTags = ref([])
const originalTags = ref([])
const isEditing = ref(false)
const valueChanged = ref(false)
const loading = ref(false)
const options = ref([])
const showDropdown = ref(false)
const tagInput = ref(null)

// Computed properties
const showRequiredError = computed(() => {
  return props.required && selectedTags.value.length === 0
})

const filteredOptions = computed(() => {
  // Filtrer d'abord les options déjà sélectionnées
  const availableOptions = options.value.filter(option => {
    // Vérifier si cette option n'est pas déjà dans les tags sélectionnés
    return !selectedTags.value.some(tag => {
      if (typeof tag === 'string' && typeof option === 'string') {
        return tag.toLowerCase() === option.toLowerCase()
      }
      
      if (typeof tag === 'object' && typeof option === 'object') {
        // Utiliser la valeur de l'ID numérique si disponible
        if (tag.value !== undefined && option.value !== undefined) {
          return tag.value === option.value
        }
        // Sinon, essayer avec uuid ou id comme fallback
        const matchesUuid = tag.uuid && option.uuid && tag.uuid === option.uuid
        const matchesId = tag.id && option.id && tag.id === option.id
        return matchesUuid || matchesId
      }
      
      return false
    })
  })
  
  // Ensuite, filtrer par le terme de recherche si nécessaire
  if (!inputValue.value.trim()) {
    return availableOptions
  }
  
  const searchTerm = inputValue.value.toLowerCase().trim()
  return availableOptions.filter(option => {
    const label = getOptionLabel(option).toLowerCase()
    return label.includes(searchTerm)
  })
})

// Méthodes
const fetchOptions = async () => {
  if (!props.comboBox || !props.sourceEndPoint) {
    return
  }
  
  try {
    loading.value = true
    const response = await apiService.get(props.sourceEndPoint)
    options.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('Erreur lors de la récupération des options:', error)
  } finally {
    loading.value = false
  }
}

const getOptionLabel = (option) => {
  if (typeof option === 'string') {
    return option
  }
  return option[props.displayedLabel] || ''
}

const getOptionId = (option) => {
  if (typeof option === 'string') {
    return option
  }
  return option.uuid || option.id || JSON.stringify(option)
}

const getTagDisplay = (tag) => {
  if (typeof tag === 'string') {
    return tag
  }
  return tag[props.displayedLabel] || ''
}

const handleInput = () => {
  if (props.comboBox) {
    showDropdown.value = true
  }
}

const addTag = () => {
  const value = inputValue.value.trim()
  if (!value) return
  
  // Vérifier si le tag existe déjà
  const tagExists = selectedTags.value.some(tag => {
    if (typeof tag === 'string') {
      return tag.toLowerCase() === value.toLowerCase()
    }
    return getTagDisplay(tag).toLowerCase() === value.toLowerCase()
  })
  
  // En mode comboBox, vérifier si le tag est dans les options disponibles
  if (props.comboBox) {
    const tagInOptions = options.value.some(option => {
      if (typeof option === 'string') {
        return option.toLowerCase() === value.toLowerCase()
      }
      return getOptionLabel(option).toLowerCase() === value.toLowerCase()
    })
    
    // Si le tag n'est pas dans les options disponibles, ne pas l'ajouter
    if (!tagInOptions) {
      inputValue.value = ''
      return
    }
    
    // Trouver l'option correspondante pour l'ajouter avec sa structure complète
    const matchingOption = options.value.find(option => {
      if (typeof option === 'string') {
        return option.toLowerCase() === value.toLowerCase()
      }
      return getOptionLabel(option).toLowerCase() === value.toLowerCase()
    })
    
    if (!tagExists && matchingOption) {
      const newTags = [...selectedTags.value, matchingOption]
      selectedTags.value = newTags
      updateModelValue()
      
      if (props.edition) {
        valueChanged.value = !areArraysEqual(selectedTags.value, originalTags.value)
        isEditing.value = valueChanged.value
      }
    }
  } else {
    // En mode libre, ajouter le tag tel quel
    if (!tagExists) {
      const newTags = [...selectedTags.value, value]
      selectedTags.value = newTags
      updateModelValue()
      
      if (props.edition) {
        valueChanged.value = !areArraysEqual(selectedTags.value, originalTags.value)
        isEditing.value = valueChanged.value
      }
    }
  }
  
  inputValue.value = ''
}

const selectOption = (option) => {
  // Vérifier si l'option existe déjà
  const optionExists = selectedTags.value.some(tag => {
    if (typeof tag === 'string' && typeof option === 'string') {
      const matches = tag.toLowerCase() === option.toLowerCase()
      return matches
    }
    
    if (typeof tag === 'object' && typeof option === 'object') {
      // Utiliser la valeur de l'ID numérique si disponible
      if (tag.value !== undefined && option.value !== undefined) {
        return tag.value === option.value
      }
      // Sinon, essayer avec uuid ou id comme fallback
      const matchesUuid = tag.uuid && option.uuid && tag.uuid === option.uuid
      const matchesId = tag.id && option.id && tag.id === option.id
      return matchesUuid || matchesId
    }
    
    return false
  })
  
  if (!optionExists) {
    const newTags = [...selectedTags.value, option]
    selectedTags.value = newTags
    updateModelValue()
    
    if (props.edition) {
      valueChanged.value = !areArraysEqual(selectedTags.value, originalTags.value)
      isEditing.value = valueChanged.value
    }
  }
  
  inputValue.value = ''
}

const removeTag = (index) => {
  const newTags = [...selectedTags.value]
  newTags.splice(index, 1)
  selectedTags.value = newTags
  updateModelValue()
  
  if (props.edition) {
    valueChanged.value = !areArraysEqual(selectedTags.value, originalTags.value)
    isEditing.value = valueChanged.value
  }
}

const updateModelValue = () => {
  emit('update:modelValue', selectedTags.value)
}

const confirmChanges = async () => {
  if (!props.uuid || !props.patchEndpoint) {
    console.error('UUID ou patchEndpoint manquant pour le mode édition')
    emit('update:error', {
      success: false,
      error: 'UUID ou patchEndpoint manquant'
    })
    return
  }
  
  try {
    const endpointWithUuid = `${props.patchEndpoint}/${props.uuid}`
    
    console.log("selectedTags.value", selectedTags.value)
    console.log("props.fieldName", props.fieldName)
    
    let tagsToSend = selectedTags.value;
    
    // Si attributeSentToServer est défini, extraire cet attribut de chaque objet
    if (props.attributeSentToServer && selectedTags.value.length > 0 && typeof selectedTags.value[0] === 'object') {
      tagsToSend = selectedTags.value.map(tag => tag[props.attributeSentToServer])
    }
    // Sinon, si les tags sont des objets avec une propriété 'name', extraire automatiquement les noms
    else if (selectedTags.value.length > 0 && typeof selectedTags.value[0] === 'object' && selectedTags.value[0].name) {
      tagsToSend = selectedTags.value.map(tag => tag.name)
    }
    
    console.log("data", {
      [props.fieldName]: tagsToSend
    })
    
    const data = {
      [props.fieldName]: tagsToSend
    }
    
    const response = await apiService.patch(endpointWithUuid, data)
    
    originalTags.value = [...selectedTags.value]
    valueChanged.value = false
    isEditing.value = false
    
    emit('update:success', {
      success: true,
      data: response
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour des tags:', error)
    emit('update:error', {
      success: false,
      error: error.message
    })
  }
}

const cancelChanges = () => {
  selectedTags.value = [...originalTags.value]
  valueChanged.value = false
  isEditing.value = false
  updateModelValue()
}

const areArraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false
  }
  
  // Pour les tableaux de chaînes
  if (typeof arr1[0] === 'string') {
    return arr1.every((item, index) => item === arr2[index])
  }
  
  // Pour les tableaux d'objets
  return arr1.every((item, index) => {
    const item2 = arr2[index]
    if (item.uuid && item2.uuid) {
      return item.uuid === item2.uuid
    }
    if (item.id && item2.id) {
      return item.id === item2.id
    }
    return JSON.stringify(item) === JSON.stringify(item2)
  })
}

const handleClickOutside = (event) => {
  if (
  tagInput.value &&
  !tagInput.value.contains(event.target) &&
  !event.target.closest('.s-tags-list__dropdown')
) {
  showDropdown.value = false
}
}

// Lifecycle hooks
onMounted(() => {
  // Initialiser les tags sélectionnés
  if (props.modelValue && Array.isArray(props.modelValue)) {
    selectedTags.value = [...props.modelValue]
    originalTags.value = [...props.modelValue]
  }
  
  // Récupérer les options si en mode comboBox
  if (props.comboBox && props.sourceEndPoint) {
    fetchOptions()
  }
  
  // Ajouter l'écouteur de clic pour fermer le dropdown
  document.addEventListener('mousedown', handleClickOutside)
})

onBeforeUnmount(() => {
  // Supprimer l'écouteur de clic
  document.removeEventListener('mousedown', handleClickOutside)
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue && Array.isArray(newValue)) {
    selectedTags.value = [...newValue]
    if (!valueChanged.value) {
      originalTags.value = [...newValue]
    }
  }
})
</script>
