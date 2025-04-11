<!-- Template pour l'affichage dynamique des champs de formulaire -->
<template>
  <form @submit.prevent="handleSubmit" class="form-fields">
    <div v-for="(field, key) in fields" :key="key" class="field-container">
      <component
        :is="components[field.type]"
        v-model="modelValue[key]"
        :label="field.label"
        :required="field.required"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :multiline="field.multiline"
        :options="field.options"
        :endpoint="typeof field.endpoint === 'function' ? field.endpoint(modelValue) : field.endpoint"
        :display-field="field.displayField"
        :value-field="field.valueField"
        :edit-mode="field.editMode"
        :columns-config="field.columnsConfig"
        :table="field.table"
        :field-name="key"
        :patch-endpoint="field.patchEndpoint"
        :mode="field.mode"
        :source-end-point="field.sourceEndPoint"
        :displayed-label="field.displayedLabel"
        :target-end-point="field.targetEndPoint"
        :target_uuid="field.target_uuid"
        :picked-items="field.pickedItems"
        :edition="field.edition"
        :helper-text="field.helperText"
        :input-type="field.inputType"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import sTextField from './common/sTextField.vue'
import sFilteredSearchField from './common/sFilteredSearchField.vue'
import sSelectField from './common/sSelectField.vue'
import sRichTextEditor from './common/sRichTextEditor.vue'
import sPickList from './common/sPickList.vue'
import sDatePicker from './common/sDatePicker.vue'
import { useObjectStore } from '@/stores/objectStore'

// Import des styles des composants
import '@/assets/styles/forms.css'
import '@/assets/styles/sTextField.css'
import '@/assets/styles/sFilteredSearchField.css'
import '@/assets/styles/sSelectField.css'
import '@/assets/styles/sPickList.css'
import '@/assets/styles/sDatePicker.css'

// Enregistrement des composants pour l'utilisation dynamique
const components = {
  sTextField,
  sFilteredSearchField,
  sSelectField,
  sRichTextEditor,
  sPickList,
  sDatePicker
}

const props = defineProps({
  modelClass: {
    type: Function,
    required: true
  },
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'submit'])
const objectStore = useObjectStore()

const fields = ref({})

onMounted(() => {
  if (!props.modelClass.getRenderableFields) {
    throw new Error('La classe du modèle doit implémenter getRenderableFields()')
  }
  fields.value = props.modelClass.getRenderableFields()
  
  // Synchroniser le store avec le modèle au chargement
  if (props.modelValue && objectStore.currentObject) {
    Object.assign(objectStore.currentObject, props.modelValue)
  }
})

// Surveiller les changements du modelValue pour mettre à jour le store
watch(() => props.modelValue, (newValue) => {
  if (newValue && objectStore.currentObject) {
    Object.assign(objectStore.currentObject, newValue)
  }
}, { deep: true })

const handleSubmit = () => {
  console.info('[FormFields] Form submitted')
  console.info('[FormFields] Current form data:', props.modelValue)
  emit('submit', props.modelValue)
  console.info('[FormFields] Emitted "submit" event with form data')
}

</script>

<style scoped>
/* Les styles spécifiques au composant qui ne sont pas dans forms.css */
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
