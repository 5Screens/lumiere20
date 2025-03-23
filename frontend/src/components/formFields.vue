<!-- Template pour l'affichage dynamique des champs de formulaire -->
<template>
  <form @submit.prevent="handleSubmit" class="form-fields">
    <div v-for="(field, key) in fields" :key="key" class="field-container">
      <label :for="key" class="field-label">{{ field.label }}</label>
      
      <component
        :is="components[field.type]"
        :id="key"
        v-model="modelValue[key]"
        :placeholder="field.placeholder"
        :disabled="field.disabled"
        :required="field.required"
        :multiline="field.multiline"
        :options="field.options"
        :table="field.table"
      />
    </div>

    <div class="form-actions">
      <button type="submit" class="submit-button">Enregistrer</button>
    </div>
  </form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import sTextField from './common/sTextField.vue'
import sFilteredSearchField from './common/sFilteredSearchField.vue'
import sSelectField from './common/sSelectField.vue'

// Enregistrement des composants pour l'utilisation dynamique
const components = {
  sTextField,
  sFilteredSearchField,
  sSelectField
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
  emit('submit', props.modelValue)
}
</script>

<style scoped>
.form-fields {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.field-container {
  margin-bottom: 1rem;
}

.field-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.form-actions {
  margin-top: 2rem;
  text-align: right;
}

.submit-button {
  padding: 0.5rem 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #45a049;
}
</style>
