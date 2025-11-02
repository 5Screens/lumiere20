<!-- Composant modal pour la création d'objets (Ticket ou Defect) -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>{{ $t('objectEditView.title') }}</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="field-container">
          <SSelectField
            :label="$t('common.createLabel')"
            :required="true"
            :endpoint="`ticket_types?lang=${currentLanguage}&toSelect=yes`"
            :mode="'creation'"
            :field-name="'ticket_type'"
            v-model="selectedType"
          />
        </div>

          <SToggleField
            v-if="selectedType"
            :label="$t('objectEditView.showOnlyRequired')"
            v-model="showOnlyRequired"
            :mode="'create'"
          />

        <form-fields
          v-if="currentModelClass"
          :key="selectedType"
          :model-class="currentModelClass"
          v-model="currentObject"
          :show-only-required="showOnlyRequired"
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
import { Task } from '@/models/Task'
import { Defect } from '@/models/Defect'
import { Incident } from '@/models/Incident'
import { Problem } from '@/models/Problem'
import { Change } from '@/models/Change'
import { Knowledge_article } from '@/models/Knowledge_article'
import { Project } from '@/models/Project'
import { Sprint } from '@/models/Sprint'
import { Epic } from '@/models/Epic'
import { Story } from '@/models/Story'
import FormFields from '@/components/formFields.vue'
import ButtonStandard from '@/components/common/ButtonStandard.vue'
import SSelectField from '@/components/common/sSelectField.vue'
import SToggleField from '@/components/common/sToggleField.vue'
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
const showOnlyRequired = ref(false)

// Accès à l'objet courant du store
const currentObject = computed({
  get: () => objectStore.currentObject,
  set: (value) => { objectStore.currentObject = value }
})

const currentModelClass = computed(() => {
  switch (selectedType.value) {
    case 'TASK':
      return Task
    case 'DEFECT':
      return Defect
    case 'INCIDENT':
      return Incident
    case 'PROBLEM':
      return Problem
    case 'CHANGE':
      return Change
    case 'KNOWLEDGE':
      return Knowledge_article
    case 'PROJECT':
      return Project
    case 'SPRINT':
      return Sprint
    case 'EPIC':
      return Epic
    case 'USER_STORY':
      return Story
    default:
      return null
  }
})

const closeModal = () => {
  // Ne pas réinitialiser le message pour permettre à l'utilisateur de voir la notification
  // Réinitialiser uniquement les données du formulaire
  objectStore.currentObject = null
  objectStore.currentObjectType = null
  objectStore.currentEndpoint = null
  objectStore.validationErrors = {}
  
  emit('close')
}

// Référence pour stocker les fichiers temporaires
const pendingAttachments = ref([])

const handleSubmit = async () => {
  try {
    console.info('[ObjectEditView] Save button clicked - Starting form submission process')
    console.info('[ObjectEditView] Form data to be submitted:', objectStore.currentObject)
    
    // Vérifier que tous les champs requis sont remplis avant de soumettre le formulaire
    console.info('[ObjectEditView] Checking required fields before submission')
    const allRequiredFieldsFilled = objectStore.checkRequiredFields()
    
    if (!allRequiredFieldsFilled) {
      console.warn('[ObjectEditView] Form submission aborted: missing required fields')
      // Le message d'erreur a déjà été mis à jour dans le store par la fonction checkRequiredFields
      return
    }
    
    // Vérifier s'il y a des pièces jointes à uploader directement depuis l'objet courant
    pendingAttachments.value = []
    
    // Vérifier si attachments existe dans l'objet courant
    if (objectStore.currentObject && objectStore.currentObject.attachments && 
        Array.isArray(objectStore.currentObject.attachments) && 
        objectStore.currentObject.attachments.length > 0) {
      
      // Filtrer pour ne garder que les fichiers qui n'ont pas d'UUID (non encore uploadés)
      const filesToUpload = objectStore.currentObject.attachments.filter(file => !file.uuid)
      
      if (filesToUpload.length > 0) {
        pendingAttachments.value = filesToUpload
        console.info(`[ObjectEditView] Found ${filesToUpload.length} pending attachments in currentObject`)
      }
    }
    
    console.info(`[ObjectEditView] Using API endpoint: ${objectStore.currentEndpoint}`)
    
    console.info('[ObjectEditView] Calling objectStore.createObject method')
    const response = await objectStore.createObject(objectStore.currentEndpoint, objectStore.currentObject)
    console.info('[ObjectEditView] Received response from createObject:', response)
    
    // Si des fichiers sont en attente et que nous avons un UUID, les uploader
    if (pendingAttachments.value.length > 0 && response && response.uuid) {
      console.info(`[ObjectEditView] Uploading ${pendingAttachments.value.length} pending attachments for object ${response.uuid}`)
      try {
        await objectStore.uploadPendingAttachments(
          response.uuid, 
          pendingAttachments.value, 
          objectStore.currentObjectType
        )
        console.info('[ObjectEditView] Attachments uploaded successfully')
      } catch (uploadError) {
        console.error('[ObjectEditView] Error uploading attachments:', uploadError)
        // Continuer même en cas d'erreur d'upload des pièces jointes
      }
    }
    
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
  const endpoint = 'tickets';
  
  switch (newType) {
    case 'TASK':
      instance = new Task()
      break
    case 'DEFECT':
      instance = new Defect()
      break
    case 'INCIDENT':
      instance = new Incident()
      break
    case 'PROBLEM':
      instance = new Problem()
      break
    case 'CHANGE':
      instance = new Change()
      break
    case 'KNOWLEDGE':
      instance = new Knowledge_article()
      break
    case 'PROJECT':
      instance = new Project()
      break
    case 'SPRINT':
      instance = new Sprint()
      break
    case 'EPIC':
      instance = new Epic()
      break
    case 'USER_STORY':
      instance = new Story()
      break
    default:
      instance = null
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
  color: var(--text-color);
}

.type-select {
  margin-left: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-separator {
  margin: 20px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}

.field-container {
  margin-bottom: 8px;
}

.form-actions {
  margin-top: 10px;
}

h2 {
  margin: 0;
}
</style>
