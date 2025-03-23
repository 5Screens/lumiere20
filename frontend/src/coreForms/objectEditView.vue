<!-- Composant modal pour la création d'objets (Ticket ou Defect) -->
<template>
  <div class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Créer un nouvel objet</h2>
        <button class="close-button" @click="closeModal">&times;</button>
      </div>

      <div class="modal-body">
        <div class="type-selector">
          <label for="objectType">Type d'objet:</label>
          <select id="objectType" v-model="selectedType" class="type-select">
            <option value="Ticket">Ticket</option>
            <option value="Defect">Défaut</option>
          </select>
        </div>

        <form-fields
          v-if="currentModelClass"
          :key="selectedType"
          :model-class="currentModelClass"
          v-model="currentModelInstance"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Ticket } from '@/models/Ticket'
import { Defect } from '@/models/Defect'
import FormFields from '@/components/formFields.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'submit'])

const selectedType = ref('Ticket')

const currentModelClass = computed(() => {
  switch (selectedType.value) {
    case 'Ticket':
      return Ticket
    case 'Defect':
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
  background-color: white;
  border-radius: 8px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
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

.type-selector {
  margin-bottom: 2rem;
}

.type-select {
  margin-left: 1rem;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

h2 {
  margin: 0;
}
</style>
