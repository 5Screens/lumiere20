<template>
  <div class="entity-form">
    <h2>{{ title }}</h2>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <form @submit.prevent="isEdit ? handleUpdate() : handleSave()">
      <div class="form-group">
        <label for="entity_id">{{ $t('entityForm.entity_id') }}</label>
        <input 
          type="text" 
          id="entity_id" 
          v-model="entityData.entity_id" 
          :placeholder="$t('entityForm.entity_id_placeholder')"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="name">{{ $t('entityForm.name') }}</label>
        <input 
          type="text" 
          id="name" 
          v-model="entityData.name" 
          :placeholder="$t('entityForm.name_placeholder')"
          required
        />
      </div>
      
      <div class="form-group">
        <label for="parent_entity_id">{{ $t('entityForm.parent_entity_id') }}</label>
        <select id="parent_entity_id" v-model="entityData.parent_entity_id">
          <option value="">{{ $t('entityForm.no_parent') }}</option>
          <option v-for="entity in parentEntities" :key="entity.uuid" :value="entity.uuid">
            {{ entity.name }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="external_id">{{ $t('entityForm.external_id') }}</label>
        <input 
          type="text" 
          id="external_id" 
          v-model="entityData.external_id" 
          :placeholder="$t('entityForm.external_id_placeholder')"
        />
      </div>
      
      <div class="form-group">
        <label for="entity_type">{{ $t('entityForm.entity_type') }}</label>
        <select id="entity_type" v-model="entityData.entity_type" required>
          <option value="">{{ $t('entityForm.select_type') }}</option>
          <option value="company">{{ $t('entityForm.type_company') }}</option>
          <option value="department">{{ $t('entityForm.type_department') }}</option>
          <option value="division">{{ $t('entityForm.type_division') }}</option>
          <option value="team">{{ $t('entityForm.type_team') }}</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="headquarters_location">{{ $t('entityForm.headquarters_location') }}</label>
        <input 
          type="text" 
          id="headquarters_location" 
          v-model="entityData.headquarters_location" 
          :placeholder="$t('entityForm.headquarters_location_placeholder')"
        />
      </div>
      
      <div class="form-group">
        <label for="is_active">{{ $t('entityForm.is_active') }}</label>
        <select id="is_active" v-model="entityData.is_active">
          <option :value="true">{{ $t('common.yes') }}</option>
          <option :value="false">{{ $t('common.no') }}</option>
        </select>
      </div>
      
      <div class="form-group">
        <label for="budget_approver_id">{{ $t('entityForm.budget_approver_id') }}</label>
        <select id="budget_approver_id" v-model="entityData.budget_approver_id">
          <option value="">{{ $t('entityForm.no_approver') }}</option>
          <option v-for="user in users" :key="user.uuid" :value="user.uuid">
            {{ user.name }}
          </option>
        </select>
      </div>
      
      <div class="form-actions">
        <button type="button" class="cancel-button" @click="handleCancel">
          {{ $t('common.cancel') }}
        </button>
        <button type="submit" class="save-button">
          {{ isEdit ? $t('common.update') : $t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

export default {
  name: 'EntityForm',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    
    // Propriétés calculées
    const title = computed(() => props.data?.title || '')
    const entityId = computed(() => props.data?.entityId || null)
    const isEdit = computed(() => !!entityId.value)
    
    // Emits
    const emits = ['cancel', 'saved', 'error', 'close-child-tab']
    
    // État local
    const entityData = ref({
      entity_id: '',
      name: '',
      parent_entity_id: '',
      external_id: '',
      entity_type: '',
      headquarters_location: '',
      is_active: true,
      budget_approver_id: ''
    })
    
    const parentEntities = ref([])
    const users = ref([])
    const error = ref(null)
    const loading = ref(false)
    
    // Charger les données de l'entité si en mode édition
    onMounted(async () => {
      try {
        // Charger la liste des entités parentes potentielles
        const entitiesResponse = await fetch('/api/entities')
        if (entitiesResponse.ok) {
          parentEntities.value = await entitiesResponse.json()
        } else {
          throw new Error(t('errors.loadingEntitiesFailed'))
        }
        
        // Charger la liste des utilisateurs pour les approbateurs de budget
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          users.value = await usersResponse.json()
        } else {
          throw new Error(t('errors.loadingUsersFailed'))
        }
        
        // Si en mode édition, charger les données de l'entité
        if (isEdit.value) {
          loading.value = true
          const response = await fetch(`/api/entities/${entityId.value}`)
          
          if (response.ok) {
            const data = await response.json()
            entityData.value = {
              entity_id: data.entity_id || '',
              name: data.name || '',
              parent_entity_id: data.parent_entity_id || '',
              external_id: data.external_id || '',
              entity_type: data.entity_type || '',
              headquarters_location: data.headquarters_location || '',
              is_active: data.is_active !== undefined ? data.is_active : true,
              budget_approver_id: data.budget_approver_id || ''
            }
          } else {
            throw new Error(t('errors.loadingEntityFailed'))
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err)
        error.value = err.message || t('errors.loadingDataFailed')
      } finally {
        loading.value = false
      }
    })
    
    // Gestion de l'annulation
    const handleCancel = () => {
      // Émettre un événement pour fermer l'onglet enfant actuel
      emit('close-child-tab')
    }
    
    // Gestion de la sauvegarde (création d'une nouvelle entité)
    const handleSave = async () => {
      try {
        loading.value = true
        error.value = null
        
        // Préparer les données pour l'API
        const entityPayload = {
          entity_id: entityData.value.entity_id,
          name: entityData.value.name,
          parent_entity_id: entityData.value.parent_entity_id || null,
          external_id: entityData.value.external_id || null,
          entity_type: entityData.value.entity_type,
          headquarters_location: entityData.value.headquarters_location || null,
          is_active: entityData.value.is_active,
          budget_approver_id: entityData.value.budget_approver_id || null
        }
        
        // Envoyer la requête à l'API
        const response = await fetch('/api/entities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entityPayload)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || t('errors.saveFailed'))
        }
        
        // Récupérer l'entité créée
        const createdEntity = await response.json()
        
        // Émettre un événement pour indiquer que l'entité a été créée
        emit('saved', createdEntity)
        
        // Message de confirmation
        alert(t('entities.saveSuccess'))
        
        // Fermer l'onglet enfant après la sauvegarde
        emit('close-child-tab')
      } catch (err) {
        console.error('Erreur lors de la sauvegarde de l\'entité:', err)
        error.value = err.message || t('errors.saveFailed')
        emit('error', { message: error.value })
      } finally {
        loading.value = false
      }
    }
    
    // Gestion de la mise à jour d'une entité existante
    const handleUpdate = async () => {
      try {
        loading.value = true
        error.value = null
        
        // Préparer les données pour l'API
        const entityPayload = {
          entity_id: entityData.value.entity_id,
          name: entityData.value.name,
          parent_entity_id: entityData.value.parent_entity_id || null,
          external_id: entityData.value.external_id || null,
          entity_type: entityData.value.entity_type,
          headquarters_location: entityData.value.headquarters_location || null,
          is_active: entityData.value.is_active,
          budget_approver_id: entityData.value.budget_approver_id || null
        }
        
        // Envoyer la requête à l'API
        const response = await fetch(`/api/entities/${entityId.value}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(entityPayload)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || t('errors.updateFailed'))
        }
        
        // Récupérer l'entité mise à jour
        const updatedEntity = await response.json()
        
        // Émettre un événement pour indiquer que l'entité a été mise à jour
        emit('saved', updatedEntity)
        
        // Message de confirmation
        alert(t('entities.updateSuccess'))
        
        // Fermer l'onglet enfant après la mise à jour
        emit('close-child-tab')
      } catch (err) {
        console.error('Erreur lors de la mise à jour de l\'entité:', err)
        error.value = err.message || t('errors.updateFailed')
        emit('error', { message: error.value })
      } finally {
        loading.value = false
      }
    }
    
    return {
      title,
      entityId,
      isEdit,
      entityData,
      parentEntities,
      users,
      error,
      loading,
      handleCancel,
      handleSave,
      handleUpdate
    }
  }
}
</script>

<style scoped>
.entity-form {
  padding: 1rem;
  max-width: 800px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-button {
  padding: 0.5rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  padding: 0.5rem 1rem;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button:hover {
  background-color: #1565c0;
}

.cancel-button:hover {
  background-color: #e0e0e0;
}
</style>
