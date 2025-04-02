<!-- Template pour l'affichage dynamique des champs de formulaire -->
<template>
  <form @submit.prevent="handleSubmit" class="form-fields">
    <div v-for="(field, key) in fields" :key="key" class="field-container">
      <label :for="key" class="field-label">{{ field.label }}</label>
      <component
        :is="components[field.type]"
        :id="key"
        v-model="modelValue[key]"
        :model-value="modelValue[key]"
        :ticket-data="modelValue"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :required="field.required"
        :multiline="field.multiline"
        :options="field.options"
        :endpoint="typeof field.endpoint === 'function' ? () => field.endpoint(modelValue) : field.endpoint"
        :display-field="field.displayField"
        :value-field="field.valueField"
        :edit-mode="field.editMode"
        :columns-config="field.columnsConfig"
        :table="field.table"
        :field-name="field.fieldName"
        :patch-endpoint="field.patchEndpoint"
        :mode="field.mode"
        :source-end-point="field.sourceEndPoint"
        :displayed-label="field.displayedLabel"
        :target-end-point="field.targetEndPoint"
        :target_uuid="field.target_uuid"
        :picked-items="field.pickedItems"
        :edition="field.edition"
        :helper-text="field.helperText"
      />
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import sTextField from './common/sTextField.vue'
import sFilteredSearchField from './common/sFilteredSearchField.vue'
import sSelectField from './common/sSelectField.vue'
import sRichTextEditor from './common/sRichTextEditor.vue'
import sPickList from './common/sPickList.vue'

// Import des styles des composants
import '@/assets/styles/forms.css'
import '@/assets/styles/sTextField.css'
import '@/assets/styles/sFilteredSearchField.css'
import '@/assets/styles/sSelectField.css'
import '@/assets/styles/sPickList.css'

// Enregistrement des composants pour l'utilisation dynamique
const components = {
  sTextField,
  sFilteredSearchField,
  sSelectField,
  sRichTextEditor,
  sPickList
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

const fields = ref({})

onMounted(() => {
  if (!props.modelClass.getRenderableFields) {
    throw new Error('La classe du modèle doit implémenter getRenderableFields()')
  }
  fields.value = props.modelClass.getRenderableFields()
})

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
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  width: 200px;
  text-align: right;
  padding-top: 0.5rem;
}
</style>
