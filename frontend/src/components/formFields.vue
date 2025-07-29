<!-- Template pour l'affichage dynamique des champs de formulaire -->
<template>
  <div>
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Chargement des champs du formulaire...</p>
    </div>
    
    <form v-else @submit.prevent="handleSubmit" class="form-fields">
      <div v-for="(field, key) in filteredFields" :key="key" class="field-container">
        <component
          :is="components[field.type]"
          :modelValue="objectStore.currentObject[key]"
          @update:modelValue="updateStoreField(key, $event)"
          :label="field.label ? t(field.label) : null"
          :required="field.required"
          :placeholder="field.placeholder ? t(field.placeholder) : null"
          :disabled="field.disabled"
          :multiline="field.multiline"
          :options="field.options"
          :endpoint="typeof field.endpoint === 'function' ? field.endpoint(objectStore.currentObject) : field.endpoint"
          :patch-endpoint="field.patchEndpoint"
          :source-end-point="field.sourceEndPoint"
          :picked-items="field.pickedItems"
          :target-end-point="field.targetEndPoint"
          :target_uuid="field.target_uuid"
          :display-field="field.displayField"
          :displayed-label="field.displayedLabel"
          :value-field="field.valueField"
          :edit-mode="field.editMode"
          :mode="field.mode"
          :columns-config="field.columnsConfig"
          :table="field.table"
          :field-name="key"
          :edition="field.edition"
          :helper-text="field.helperText ? t(field.helperText) : null"
          :input-type="field.inputType"
          :combo-box="field.comboBox"
          :visible="typeof field.visible === 'function' ? field.visible(objectStore.currentObject) : (field.visible !== undefined ? field.visible : true)"
          :resetable="field.resetable"
          :attributeSentToServer="field.attributeSentToServer"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import sTextField from './common/sTextField.vue'
import sFilteredSearchField from './common/sFilteredSearchField.vue'
import sSelectField from './common/sSelectField.vue'
import sRichTextEditor from './common/sRichTextEditor.vue'
import sPickList from './common/sPickList.vue'
import sDatePicker from './common/sDatePicker.vue'
import sTagsList from './common/sTagsList.vue'
import sFileUploader from './common/sFileUploader.vue'
import { useObjectStore } from '@/stores/objectStore'

// Import des styles des composants
import '@/assets/styles/forms.css'
import '@/assets/styles/sTextField.css'
import '@/assets/styles/sFilteredSearchField.css'
import '@/assets/styles/sSelectField.css'
import '@/assets/styles/sPickList.css'
import '@/assets/styles/sDatePicker.css'
import '@/assets/styles/sTagsList.css'
import '@/assets/styles/sFileUploader.css'

// Enregistrement des composants pour l'utilisation dynamique
const components = {
  sTextField,
  sFilteredSearchField,
  sSelectField,
  sRichTextEditor,
  sPickList,
  sDatePicker,
  sTagsList,
  sFileUploader
}

const props = defineProps({
  modelClass: {
    type: Function,
    required: true
  },
  modelValue: {
    type: Object,
    required: true
  },
  showOnlyRequired: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])
const objectStore = useObjectStore()
const { t } = useI18n()

const fields = ref({})
const isLoading = ref(true)

// Computed property to filter fields based on showOnlyRequired prop
const filteredFields = computed(() => {
  if (!props.showOnlyRequired) {
    return fields.value
  }
  
  // Filter fields to only show required ones
  const requiredFields = {}
  Object.entries(fields.value).forEach(([key, field]) => {
    if (field.required === true) {
      requiredFields[key] = field
    }
  })
  
  return requiredFields
})

onMounted(async () => {
  if (!props.modelClass.getRenderableFields) {
    throw new Error('La classe du modèle doit implémenter getRenderableFields()')
  }
  
  try {
    // Vérifier si getRenderableFields est une fonction asynchrone
    const renderableFields = props.modelClass.getRenderableFields('for_creation')
    
    if (renderableFields instanceof Promise) {
      // Si c'est une promesse, attendre sa résolution
      console.info('[FormFields] Waiting for async getRenderableFields to resolve')
      fields.value = await renderableFields
    } else {
      // Sinon, utiliser directement le résultat
      fields.value = renderableFields
    }
    
    // Synchroniser le store avec le modèle au chargement (une seule fois)
    if (props.modelValue && objectStore.currentObject) {
      Object.assign(objectStore.currentObject, props.modelValue)
    }
  } catch (error) {
    console.error('[FormFields] Error loading renderable fields:', error)
  } finally {
    isLoading.value = false
  }
})

// Fonction pour mettre à jour directement le store
const updateStoreField = (key, value) => {
  if (objectStore.currentObject) {
    objectStore.currentObject[key] = value
    // On émet quand même l'événement pour maintenir la compatibilité avec les composants parents
    emit('update:modelValue', objectStore.currentObject)
  }
}

const handleSubmit = () => {
  console.info('[FormFields] Form submitted')
  console.info('[FormFields] Current form data:', objectStore.currentObject)
  emit('submit', objectStore.currentObject)
  console.info('[FormFields] Emitted "submit" event with form data')
}

</script>

<style scoped>
/* Les styles spécifiques au composant qui ne sont pas dans forms.css */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.form-fields {
  padding: 1rem;
  max-width: 800px;
  max-height: 600px;
  margin: 0 auto;
  overflow-y: auto;
}

.field-container {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  margin-bottom: 1rem;
  width: 100%;
}

.field-label {
  flex: 0 0 200px;
  margin-right: 1rem;
  font-weight: 500;
  padding-top: 0.5rem;
  text-align: right;
}

@media (max-width: 768px) {
  .field-container {
    flex-direction: column;
  }
  
  .field-label {
    flex: 0 0 auto;
    margin-bottom: 0.5rem;
    text-align: left;
  }
}
</style>
