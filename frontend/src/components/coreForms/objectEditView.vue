<!-- Composant modal pour la création d'objets (Ticket ou Defect) -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ $t('objectEditView.title') }}</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <SSelectField
          :label="$t('common.createLabel')"
          :required="true"
          :endpoint="`ticket_types?lang=${currentLanguage}&toSelect=yes`"
          :mode="'creation'"
          :field-name="'ticket_type'"
          v-model="selectedType"
        />

        <form-fields
          v-if="currentModelClass"
          :key="selectedType"
          :model-class="currentModelClass"
          v-model="currentObject"
        />

        <hr class="form-separator" />
        <div class="form-actions">
          <ButtonStandard
            type="submit"
            :label="$t('common.save')"
            variant="primary"
            @click="handleSubmit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Ticket } from '@/models/Ticket'
import { Defect } from '@/models/Defect'
import { Incident } from '@/models/Incident'
import FormFields from '@/components/formFields.vue'
import ButtonStandard from '@/components/common/ButtonStandard.vue'
import SSelectField from '@/components/common/sSelectField.vue'
import { useUserProfileStore } from '@/stores/userProfileStore'
import { useObjectStore } from '@/stores/objectStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const userProfileStore = useUserProfileStore()
const objectStore = useObjectStore()
const currentLanguage = computed(() => userProfileStore.language)

const selectedType = ref('')

// Accès à l'objet courant du store
const currentObject = computed({
  get: () => objectStore.currentObject,
  set: (value) => { objectStore.currentObject = value }
})

const currentModelClass = computed(() => {
  switch (selectedType.value) {
    case 'TICKET':
      return Ticket
    case 'DEFECT':
      return Defect
    case 'INCIDENT':
      return Incident
    default:
      return null
  }
})

const closeModal = () => {
  objectStore.resetObjectForm()
  emit('close')
}

const handleSubmit = async () => {
  try {
    console.info('[ObjectEditView] Save button clicked - Starting form submission process')
    console.info('[ObjectEditView] Form data to be submitted:', objectStore.currentObject)
    
    console.info(`[ObjectEditView] Using API endpoint: ${objectStore.currentEndpoint}`)
    
    console.info('[ObjectEditView] Calling objectStore.createObject method')
    const response = await objectStore.createObject(objectStore.currentEndpoint, objectStore.currentObject)
    console.info('[ObjectEditView] Received response from createObject:', response)
    
    closeModal()
    console.info('[ObjectEditView] Modal closed after successful submission')
  } catch (error) {
    console.error('[ObjectEditView] Error creating object:', error)
  }
}

// Réinitialise l'instance quand le type change
watch(selectedType, (newType) => {
  console.info(`[ObjectEditView] Selected type changed to: ${newType}`);
  
  let instance;
  let endpoint;
  
  switch (newType) {
    case 'TICKET':
      instance = new Ticket()
      endpoint = 'tickets'
      break
    case 'DEFECT':
      instance = new Defect()
      endpoint = 'tickets?type=DEFECT'
      break
    case 'INCIDENT':
      instance = new Incident()
      endpoint = 'tickets?type=INCIDENT'
      break
    default:
      instance = null
      endpoint = null
  }
  
  // Initialise l'objet dans le store
  if (instance) {
    objectStore.initObjectForm(newType, instance, endpoint)
  }
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--bg-color);
  border-radius: 10px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-color);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #eee;
}

.modal-body {
  padding: 1rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
}

.type-select {
  margin-left: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-separator {
  margin: 1rem 0;
  border: none;
  border-top: 1px solid #ccc;
}

.form-actions {
  margin-top: 10px;
}

h2 {
  margin: 0;
}
</style>
