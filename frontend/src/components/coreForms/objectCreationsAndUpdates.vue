<template>
  <div class="form">
    <div class="form__header">
      <div class="form__header-actions">
        <h3 class="header-title">{{ title }}</h3>
        <ButtonStandard
          icon="fas fa-save"
          variant="primary"
          :loading="loading"
          @click="handleSave"
          :title="$t('common.save')"
          label=""
        />
      </div>
    </div>
      
    <div class="form__content">
      <!-- Champs dynamiques générés à partir du modèle -->
      <template v-for="(field, fieldName) in formFields" :key="fieldName">
        <!-- Champ texte standard -->
        <sTextField
          v-if="field.type === 'sTextField'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :placeholder="field.placeholder"
          :helperText="field.helperText"
          :disabled="field.disabled"
          :readonly="field.readonly"
          :inputType="field.inputType"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          :uuid="objectId"
          :fieldName="fieldName"
          :apiEndpoint="field.apiEndpoint"
          :editMode="mode === 'update'"
        />
        
        <!-- Champ de sélection -->
        <sSelectField
          v-else-if="field.type === 'sSelectField'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :placeholder="field.placeholder"
          :endpoint="getEndpoint(field.endpoint, formData)"
          :mode="mode"
          :uuid="objectId"
          :patchEndpoint="field.patchEndpoint"
          @update:success="handleFieldSuccess"
        />
        
        <!-- Éditeur de texte riche -->
        <sRichTextEditor
          v-else-if="field.type === 'sRichTextEditor'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :placeholder="field.placeholder"
        />
        
        <!-- Champ de recherche filtré -->
        <sFilteredSearchField
          v-else-if="field.type === 'sFilteredSearchField'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :placeholder="field.placeholder"
          :endpoint="getEndpoint(field.endpoint, formData)"
          :displayField="field.displayField"
          :valueField="field.valueField"
          :columnsConfig="field.columnsConfig"
          @update:modelValue="handleFieldChange(fieldName, $event)"
        />
        
        <!-- Liste de sélection -->
        <sPickList
          v-else-if="field.type === 'sPickList'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :helperText="field.helperText"
          :placeholder="field.placeholder"
          :sourceEndPoint="getEndpoint(field.sourceEndPoint, formData)"
          :displayedLabel="field.displayedLabel"
          :targetEndPoint="getEndpoint(field.targetEndPoint, formData)"
          :target_uuid="objectId"
          :pickedItems="formData[fieldName]"
        />
        
        <!-- Sélecteur de date -->
        <sDatePicker
          v-else-if="field.type === 'sDatePicker'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :placeholder="field.placeholder"
          :helperText="field.helperText"
          :disabled="field.disabled"
        />
        
        <!-- Champ de bascule -->
        <sToggleField
          v-else-if="field.type === 'sToggleField'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
        />
        
        <!-- Uploader de fichiers -->
        <sFileUploader
          v-else-if="field.type === 'sFileUploader'"
          v-model="formData[fieldName]"
          :label="field.label"
          :required="field.required"
          :uuid="objectId"
        />
      </template>
      
      <!-- Tableau d'audit pour afficher l'historique des modifications -->
      <AuditTable 
        v-if="objectId" 
        :objectUuid="objectId"
      />
    </div>
    
    <div class="form__footer">
      <!-- Le bouton Enregistrer a été déplacé dans le header -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTabsStore } from '@/stores/tabsStore';

// Import des composants
import ButtonStandard from '@/components/common/ButtonStandard.vue';
import sTextField from '@/components/common/sTextField.vue';
import sSelectField from '@/components/common/sSelectField.vue';
import sRichTextEditor from '@/components/common/sRichTextEditor.vue';
import sFilteredSearchField from '@/components/common/sFilteredSearchField.vue';
import sPickList from '@/components/common/sPickList.vue';
import sDatePicker from '@/components/common/sDatePicker.vue';
import sToggleField from '@/components/common/sToggleField.vue';
import sFileUploader from '@/components/common/sFileUploader.vue';
import AuditTable from '@/components/common/auditTable.vue';

// Import du service API
import apiService from '@/services/apiService';

// Import des modèles
import { Entity } from '@/models/Entity';
import { Symptom } from '@/models/Symptom';
import { Ticket } from '@/models/Ticket';
import { Incident } from '@/models/Incident';
import { Problem } from '@/models/Problem';
import { Change } from '@/models/Change';
import { Knowledge_article } from '@/models/Knowledge_article';
import { Project } from '@/models/Project';
import { Sprint } from '@/models/Sprint';
import { Epic } from '@/models/Epic';
import { Story } from '@/models/Story';
import { Defect } from '@/models/Defect';

const { t } = useI18n();

// Initialisation du store des onglets
const tabsStore = useTabsStore();

// Props
const props = defineProps({
  mode: {
    type: String,
    default: 'creation',
    validator: (value) => ['creation', 'update'].includes(value)
  },
  objectType: {
    type: String,
    required: true
  },
  objectId: {
    type: String,
    default: null
  },
  tabId: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['saved', 'error', 'close-tab']);

// État local
const formData = ref({});
const loading = ref(false);
const error = ref(null);
const modelInstance = ref(null);

// Computed properties
const title = computed(() => {
  if (props.mode === 'creation') {
    return t(`objectCreationsAndUpdates.${props.objectType}Creation`);
  } else {
    return `${t(`objectCreationsAndUpdates.${props.objectType}Update`)} (${props.objectId || ''})`;
  }
});

const formFields = computed(() => {
  if (!modelInstance.value) return {};
  
  // Récupérer les champs rendables du modèle
  if (typeof modelInstance.value.constructor.getRenderableFields === 'function') {
    return modelInstance.value.constructor.getRenderableFields();
  }
  
  return {};
});

// Méthodes
const initializeModel = () => {
  const modelMap = {
    'entity': Entity,
    'symptom': Symptom,
    'ticket': Ticket,
    'incident': Incident,
    'problem': Problem,
    'change': Change,
    'knowledge': Knowledge_article,
    'project': Project,
    'sprint': Sprint,
    'epic': Epic,
    'story': Story,
    'defect': Defect
  };
  
  const ModelClass = modelMap[props.objectType];
  if (ModelClass) {
    modelInstance.value = new ModelClass();
    // Initialiser formData avec les valeurs par défaut du modèle
    formData.value = { ...modelInstance.value };
  } else {
    console.error(`[objectCreationsAndUpdates] Modèle non trouvé pour le type: ${props.objectType}`);
    error.value = `Modèle non trouvé pour le type: ${props.objectType}`;
  }
};

const fetchObjectData = async () => {
  if (props.mode !== 'update' || !props.objectId) return;
  
  try {
    loading.value = true;
    
    // Déterminer l'endpoint API en fonction du type d'objet
    const endpoint = `${props.objectType}s/${props.objectId}`;
    const data = await apiService.get(endpoint);
    
    // Créer une nouvelle instance du modèle avec les données récupérées
    const modelMap = {
      'entity': Entity,
      'symptom': Symptom,
      'ticket': Ticket,
      'incident': Incident,
      'problem': Problem,
      'change': Change,
      'knowledge': Knowledge_article,
      'project': Project,
      'sprint': Sprint,
      'epic': Epic,
      'story': Story,
      'defect': Defect
    };
    
    const ModelClass = modelMap[props.objectType];
    if (ModelClass) {
      modelInstance.value = new ModelClass(data);
      formData.value = { ...modelInstance.value };
      
      // Enregistrer l'objet dans le store
      tabsStore.setObjectInEditing(props.tabId, {
        objectType: props.objectType,
        objectId: props.objectId,
        data: { ...formData.value }
      });
    }
  } catch (err) {
    console.error(`[objectCreationsAndUpdates] Erreur lors de la récupération des données: ${err.message}`, err);
    error.value = err.message || t('errors.fetchData');
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};

const handleSave = async () => {
  try {
    // Vérifier que tous les champs requis sont remplis
    const requiredFields = Object.entries(formFields.value)
      .filter(([_, field]) => field.required)
      .map(([fieldName, field]) => ({ name: fieldName, label: field.label }));
    
    const missingFields = requiredFields.filter(field => 
      !formData.value[field.name] || 
      (Array.isArray(formData.value[field.name]) && formData.value[field.name].length === 0)
    );
    
    if (missingFields.length > 0) {
      const missingFieldsText = missingFields.map(field => field.label).join(', ');
      throw new Error(t('errors.requiredFields', { fields: missingFieldsText }));
    }
    
    loading.value = true;
    
    // Mettre à jour l'instance du modèle avec les données du formulaire
    Object.assign(modelInstance.value, formData.value);
    
    // Préparer les données pour l'API
    const apiData = modelInstance.value.toAPI ? modelInstance.value.toAPI(props.mode) : formData.value;
    
    let response;
    if (props.mode === 'creation') {
      // Créer un nouvel objet
      const endpoint = `${props.objectType}s`;
      response = await apiService.post(endpoint, apiData);
    } else {
      // Mettre à jour un objet existant
      const endpoint = `${props.objectType}s/${props.objectId}`;
      response = await apiService.put(endpoint, apiData);
    }
    
    // Émettre l'événement de succès
    emit('saved', response);
    
    // Afficher un message de confirmation
    alert(t(`${props.objectType}.saveSuccess`));
    
    // Fermer l'onglet
    tabsStore.closeTab(props.tabId);
  } catch (err) {
    console.error(`[objectCreationsAndUpdates] Erreur lors de la sauvegarde: ${err.message}`, err);
    error.value = err.message || t('errors.saveData');
    emit('error', error.value);
    
    // Afficher un message d'erreur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

const handleFieldChange = (fieldName, value) => {
  formData.value[fieldName] = value;
  
  // Mettre à jour l'objet dans le store
  tabsStore.updateObjectInEditing(props.tabId, {
    objectType: props.objectType,
    objectId: props.objectId,
    data: { ...formData.value }
  });
};

const handleFieldSuccess = () => {
  // Mettre à jour l'objet dans le store après une modification réussie
  tabsStore.updateObjectInEditing(props.tabId, {
    objectType: props.objectType,
    objectId: props.objectId,
    data: { ...formData.value }
  });
};

// Fonction utilitaire pour gérer les endpoints dynamiques
const getEndpoint = (endpoint, data) => {
  if (typeof endpoint === 'function') {
    return endpoint(data);
  }
  return endpoint;
};

// Initialisation du composant
onMounted(async () => {
  initializeModel();
  await fetchObjectData();
  
  // Si c'est un nouvel objet, initialiser dans le store
  if (props.mode === 'creation') {
    tabsStore.setObjectInEditing(props.tabId, {
      objectType: props.objectType,
      objectId: null,
      data: { ...formData.value }
    });
  }
});

// Surveiller les changements dans les données du formulaire
/*watch(formData, (newValue) => {
  // Mettre à jour l'objet dans le store
  tabsStore.updateObjectInEditing(props.tabId, {
    objectType: props.objectType,
    objectId: props.objectId,
    data: { ...newValue }
  });
}, { deep: true });*/
</script>

<style scoped src="@/assets/styles/forms.css"></style>
