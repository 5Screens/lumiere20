<template>
  <div class="form">
    <div class="form__content">
      <!-- Champ Global Information avec UUID -->
      <div class="form-section">
        <h3>Global information (uuid: {{ entityData.uuid || 'New entity' }})</h3>
      </div>
      
      <!-- Champ libre pour le nom -->
      <STextField
        v-model="entityData.name"
        :label="$t('entities.name')"
        :required="true"
        :uuid="entityData.uuid"
        field-name="name"
        api-endpoint="entities"
        :edit-mode="!!entityData.uuid"
      />
      
      <!-- Champ libre pour entity_id -->
      <STextField
        v-model="entityData.entity_id"
        :label="$t('entities.entity_id')"
        :required="true"
        :uuid="entityData.uuid"
        field-name="entity_id"
        api-endpoint="entities"
        :edit-mode="!!entityData.uuid"
      />
      
      <!-- Champ libre pour external_id -->
      <STextField
        v-model="entityData.external_id"
        :label="$t('entities.external_id')"
        :required="false"
        :uuid="entityData.uuid"
        field-name="external_id"
        api-endpoint="entities"
        :edit-mode="!!entityData.uuid"
      />
      
      <!-- Champ de sélection pour le type d'entité -->
      <SSelectField
        v-model="entityData.entity_type"
        :label="$t('entities.entity_type')"
        :required="true"
        :options-endpoint="`entities_types?langue=${currentLanguage}&toSelect=yes`"
        :mode="entityId ? 'edition' : 'creation'"
        :uuid="entityData.uuid"
        :patch-endpoint="'entities'"
        :field-name="'entity_type'"
        @update:success="handleFieldUpdated('entity_type', $event)"
      />
      
      <!-- Champ toggle pour is_active -->
      <sToggleField
        v-model="entityData.is_active"
        :label="$t('entities.is_active')"
        :required="false"
        :mode="entityId ? 'edit' : 'create'"
        :uuid="entityData.uuid"
        patch-endpoint="entities"
        field-name="is_active"
        @update:success="handleFieldUpdated('is_active', $event)"
      />
      
      <!-- Champ de recherche filtré pour la localisation -->
      <SFilteredSearchField
        v-model="entityData.rel_headquarters_location"
        :label="$t('entities.location')"
        :required="false"
        :endpoint="'locations'"
        :edit-mode="!!entityData.uuid"
        :uuid="entityData.uuid"
        field-name="rel_headquarters_location"
        :patch-endpoint="'entities'"
        :columns-config="[
          { key: 'uuid', label: 'ID', visible: false },
          { key: 'name', label: 'Name', visible: true },
          { key: 'status', label: 'Status', visible: true },
          { key: 'type', label: 'Type', visible: true },
          { key: 'city', label: 'City', visible: true },
          { key: 'state_province', label: 'State/Province', visible: true },
          { key: 'country', label: 'Country', visible: true },
          { key: 'postal_code', label: 'Postal Code', visible: false },
          { key: 'street', label: 'Street', visible: false },
          { key: 'phone', label: 'Phone', visible: false },
          { key: 'time_zone', label: 'Time Zone', visible: false },
          { key: 'business_criticality', label: 'Business Criticality', visible: false },
          { key: 'opening_hours', label: 'Opening Hours', visible: false },
          { key: 'site_id', label: 'Site ID', visible: false },
          { key: 'site_created_on', label: 'Site Created On', visible: false },
          { key: 'alternative_site_reference', label: 'Alt. Site Ref.', visible: false },
          { key: 'wan_design', label: 'WAN Design', visible: false },
          { key: 'network_telecom_service', label: 'Network Service', visible: true },
          { key: 'comments', label: 'Comments', visible: false },
          { key: 'primary_entity_uuid', label: 'Primary Entity', visible: false },
          { key: 'field_service_group_uuid', label: 'Field Service Group', visible: false },
          { key: '  d', label: 'Parent Location', visible: false }
        ]"
        @update:success="handleFieldUpdated('rel_headquarters_location', $event)"
      />
      
      <!-- Champ de recherche filtré pour l'entité parente -->
      <SFilteredSearchField
        v-model="entityData.parent_uuid"
        :label="$t('entities.parent')"
        :required="false"
        :endpoint="'entities'"
        :edit-mode="!!entityData.uuid"
        :uuid="entityData.uuid"
        field-name="parent_uuid"
        :patch-endpoint="'entities'"
        :columns-config="[
          { key: 'uuid', label: 'ID', visible: false },
          { key: 'name', label: 'Name', visible: true },
          { key: 'entity_id', label: 'Entity ID', visible: true },
          { key: 'external_id', label: 'External ID', visible: true },
          { key: 'entity_type', label: 'Type', visible: true },
          { key: 'is_active', label: 'Active', visible: true }
        ]"
        @update:success="handleFieldUpdated('parent_uuid', $event)"
      />
      
      <!-- Composant d'exploration des relations -->
      <sRelationsExplorer
        v-if="entityData.uuid"
        :objectType="'entities'"
        :objectUuid="entityData.uuid"
        :mode="entityData.uuid ? 'edition' : 'creation'"
      />
      
      <!-- Tableau d'audit pour afficher l'historique des modifications -->
      <AuditTable 
        v-if="entityData.uuid" 
        :objectUuid="entityData.uuid"
      />
    </div>
    
    <div class="form__footer">
      <ButtonStandard
        :label="$t('common.cancel')"
        variant="secondary"
        @click="handleCancel"
      />
      <ButtonStandard
        :label="$t('common.save')"
        variant="primary"
        :loading="loading"
        @click="handleAction"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';

// Import des composants
import STextField from '@/components/common/sTextField.vue';
import ButtonStandard from '@/components/common/ButtonStandard.vue';
import AuditTable from '@/components/common/auditTable.vue';
import SSelectField from '@/components/common/sSelectField.vue'; // Import du composant SSelectField
import SFilteredSearchField from '@/components/common/sFilteredSearchField.vue'; // Import du composant SFilteredSearchField
import sToggleField from '@/components/common/sToggleField.vue'; // Import du composant sToggleField
import sRelationsExplorer from '@/components/common/sRelationsExplorer.vue'; // Import du composant sRelationsExplorer

// Import du service API
import apiService from '@/services/apiService';

// Import des styles
import '@/assets/styles/forms.css';

const { t, locale } = useI18n();
const currentLanguage = computed(() => locale.value);

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      title: 'Entity',
      entityId: null
    })
  }
});

// Computed properties pour extraire les données du props data
const title = computed(() => props.data?.title || 'Entity');
const entityId = computed(() => props.data?.entityId || null);

// Emits
const emit = defineEmits(['cancel', 'saved', 'error', 'close-tab', 'close-child-tab']);

// État local
const entityData = ref({
  uuid: '',
  name: '',
  entity_id: '',
  external_id: '',
  entity_type: '', // Ajout du champ entity_type
  rel_headquarters_location: null, // Ajout du champ rel_headquarters_location
  parent_uuid: null, // Ajout du champ parent_uuid
  is_active: true, // Ajout du champ is_active avec valeur par défaut true
  originalValues: {} // Stockage des valeurs originales pour détecter les changements
});
const loading = ref(false);
const error = ref(null);

// Chargement des données de l'entité si on est en mode édition
const fetchEntityData = async () => {
  if (!entityId.value) return;
  
  try {
    loading.value = true;
    console.log('[fetchEntityData] Fetching data for entity ID:', entityId.value);
    const response = await apiService.get(`entities/${entityId.value}`);
    
    // Log the raw API response
    console.log('[fetchEntityData] Raw API response:', response);
    
    // Les données sont maintenant directement dans la réponse, plus besoin d'accéder à response.data
    const data = response;
    console.log('[fetchEntityData] API data:', {
      uuid: data.uuid,
      name: data.name,
      entity_id: data.entity_id,
      external_id: data.external_id,
      entity_type: data.entity_type,
      rel_headquarters_location: data.rel_headquarters_location,
      parent_uuid: data.parent_uuid,
      is_active: data.is_active,
      // Log any additional fields that might be present
      additionalFields: Object.keys(data).filter(key => 
        !['uuid', 'name', 'entity_id', 'external_id', 'entity_type', 
          'rel_headquarters_location', 'parent_uuid', 'is_active'].includes(key)
      ).reduce((acc, key) => ({ ...acc, [key]: data[key] }), {})
    });
    
    // Transformer les données reçues du backend au format attendu par le frontend
    const transformedData = {
      uuid: data.uuid || '',
      name: data.name || '',
      entity_id: data.entity_id || '',
      external_id: data.external_id || '',
      entity_type: data.entity_type || '',
      rel_headquarters_location: data.rel_headquarters_location || null,
      parent_uuid: data.parent_uuid || null,
      is_active: data.is_active !== undefined ? data.is_active : true,
      originalValues: {
        name: data.name || '',
        entity_id: data.entity_id || '',
        external_id: data.external_id || '',
        entity_type: data.entity_type || '',
        rel_headquarters_location: data.rel_headquarters_location || null,
        parent_uuid: data.parent_uuid || null,
        is_active: data.is_active !== undefined ? data.is_active : true
      }
    };
    
    console.log('[fetchEntityData] Transformed data:', transformedData);
    
    // Mettre à jour les données du formulaire
    entityData.value = transformedData;
    console.log('[fetchEntityData] Updated entity data:', entityData.value);
    
  } catch (err) {
    console.error('[fetchEntityData] Error:', err);
    console.error('[fetchEntityData] Error details:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      responseData: err.response?.data
    });
    error.value = err.message || t('errors.fetchEntityData');
    emit('error', error.value);
    
    // Afficher un message d'erreur à l'utilisateur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

// Gestion de l'annulation
const handleCancel = () => {
  // Émettre un événement pour fermer l'onglet enfant actuel
  emit('close-child-tab');
};

// Gestion de la sauvegarde (création d'une nouvelle entité)
const handleSave = async () => {
  try {
    loading.value = true;
    
    // Transformer les données au format attendu par le backend
    const transformedData = {
      name: entityData.value.name,
      entity_id: entityData.value.entity_id,
      external_id: entityData.value.external_id,
      entity_type: entityData.value.entity_type, // Ajout du champ entity_type
      rel_headquarters_location: entityData.value.rel_headquarters_location, // Ajout du champ rel_headquarters_location
      parent_uuid: entityData.value.parent_uuid, // Ajout du champ parent_uuid
      is_active: entityData.value.is_active // Ajout du champ is_active
    };
    
    console.log('Form data before validation:', {
      name: transformedData.name,
      entity_id: transformedData.entity_id,
      entity_type: transformedData.entity_type
    });
    
    if (!transformedData.name || !transformedData.entity_id || !transformedData.entity_type) {
      console.error('Missing required fields:', {
        name: !transformedData.name,
        entity_id: !transformedData.entity_id,
        entity_type: !transformedData.entity_type
      });
      throw new Error(t('errors.requiredFields'));
    }
    
    // Appel API POST pour créer une nouvelle entité
    const data = await apiService.post('entities', transformedData);
    
    // Si succès, émission de l'événement saved
    emit('saved', data);
    
    // Message de confirmation
    alert(t('entities.saveSuccess'));
    
    // Fermer l'onglet enfant après la sauvegarde
    emit('close-child-tab');
  } catch (err) {
    console.error('Error saving entity:', err);
    error.value = err.message || 'Error during save';
    emit('error', error.value);
    
    // Message d'erreur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

// Gestion de la mise à jour d'une entité existante
const handleUpdate = async () => {
  try {
    loading.value = true;
    
    // Vérifier quels champs ont été modifiés
    const changedFields = {};
    
    if (entityData.value.name !== entityData.value.originalValues.name) {
      changedFields.name = entityData.value.name;
    }
    
    if (entityData.value.entity_id !== entityData.value.originalValues.entity_id) {
      changedFields.entity_id = entityData.value.entity_id;
    }
    
    if (entityData.value.external_id !== entityData.value.originalValues.external_id) {
      changedFields.external_id = entityData.value.external_id;
    }
    
    if (entityData.value.entity_type !== entityData.value.originalValues.entity_type) {
      changedFields.entity_type = entityData.value.entity_type;
    }
    
    if (entityData.value.rel_headquarters_location !== entityData.value.originalValues.rel_headquarters_location) {
      changedFields.rel_headquarters_location = entityData.value.rel_headquarters_location;
    }
    
    if (entityData.value.parent_uuid !== entityData.value.originalValues.parent_uuid) {
      changedFields.parent_uuid = entityData.value.parent_uuid;
    }
    
    if (entityData.value.is_active !== entityData.value.originalValues.is_active) {
      changedFields.is_active = entityData.value.is_active;
    }
    
    // Si aucun champ n'a été modifié, ne rien faire
    if (Object.keys(changedFields).length === 0) {
      alert(t('common.noChanges'));
      loading.value = false;
      return;
    }
    
    // Vérifier que les champs obligatoires sont remplis
    if (changedFields.hasOwnProperty('name') && !changedFields.name) {
      throw new Error(t('errors.nameRequired'));
    }
    
    if (changedFields.hasOwnProperty('entity_id') && !changedFields.entity_id) {
      throw new Error(t('errors.entityIdRequired'));
    }
    
    if (changedFields.hasOwnProperty('entity_type') && !changedFields.entity_type) {
      throw new Error(t('errors.entityTypeRequired'));
    }
    
    // Appel API PUT pour mettre à jour l'entité
    await apiService.put(`entities/${entityData.value.uuid}`, changedFields);
    
    // Si succès, émission de l'événement saved
    emit('saved', { entity_id: entityId.value });
    
    // Message de confirmation
    alert(t('entities.updateSuccess'));
    
    // Fermer l'onglet enfant après la mise à jour
    emit('close-child-tab');
  } catch (err) {
    console.error('Error updating entity:', err);
    error.value = err.message || 'Error during update';
    emit('error', error.value);
    
    // Message d'erreur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

// Gestion des mises à jour de champs individuels
const handleFieldUpdated = (field, value) => {
  console.info(`Field ${field} updated with value: ${value}`);
  
  // Mettre à jour la valeur originale pour éviter des mises à jour multiples
  if (entityData.value.originalValues) {
    entityData.value.originalValues[field] = value;
  }
};

// Fonction qui détermine quelle action effectuer en fonction du mode (création ou édition)
const handleAction = () => {
  if (entityId.value) {
    handleUpdate();
  } else {
    handleSave();
  }
};

// Initialisation du composant
onMounted(async () => {
  if (entityId.value) {
    await fetchEntityData();
  }
});
</script>

<style scoped>
@import '@/assets/styles/forms.css';

.form-section {
  margin-bottom: 1rem;
}

.form-section h3 {
  font-size: 1.1rem;
  color: var(--text-color);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color-light);
}
</style>
