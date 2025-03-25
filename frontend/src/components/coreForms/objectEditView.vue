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
          :label="$t('configuration.ticketTypes')"
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
          v-model="currentModelInstance"
        />

        <hr class="form-separator" />
        <div class="form-actions">
          <ButtonStandard
            type="submit"
            label="Enregistrer"
            variant="primary"
            @click="handleSubmit(currentModelInstance)"
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
import FormFields from '@/components/formFields.vue'
import ButtonStandard from '@/components/common/ButtonStandard.vue'
import SSelectField from '@/components/common/sSelectField.vue'
import { useUserProfileStore } from '@/stores/userProfileStore'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])
const userProfileStore = useUserProfileStore()
const currentLanguage = computed(() => userProfileStore.language)

const selectedType = ref('Ticket')

const currentModelClass = computed(() => {
  switch (selectedType.value) {
    case 'TICKET':
      return Ticket
    case 'DEFECT':
      return Defect
    default:
      return null
  }
})

const currentModelInstance = ref(new Ticket())

const closeModal = () => {
  emit('close')
}

const handleSubmit = (formData) => {
  emit('submit', {
    type: selectedType.value,
    data: formData
  })
  closeModal()
}

// Réinitialise l'instance quand le type change
watch(selectedType, (newType) => {
  currentModelInstance.value = newType === 'Ticket' ? new Ticket() : new Defect()
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
