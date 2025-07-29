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
      <!-- Indicateur de chargement -->
      <div v-if="mode === 'update' && loading" class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i>
        {{ $t('common.loading') }}
      </div>
      
      <!-- Champs dynamiques générés à partir du modèle -->
      <template v-if="mode === 'creation' || (mode === 'update' && !loading)">
        <template v-for="(field, fieldName) in formFields" :key="fieldName">
          <!-- Champ texte standard -->
          <sTextField
            v-if="field.type === 'sTextField'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :helperText="field.helperText ? $t(field.helperText) : null"
            :disabled="field.disabled"
            :readonly="field.readonly"
            :inputType="field.inputType"
            :min="field.min"
            :max="field.max"
            :step="field.step"
            :uuid="objectId"
            :fieldName="fieldName"
            :apiEndpoint="modelInstance ? modelInstance.constructor.getApiEndpoint('PATCH') : ''"
            :editMode="mode === 'update'"
          />
          
          <!-- Champ de sélection -->
          <sSelectField
            v-else-if="field.type === 'sSelectField'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :endpoint="getEndpoint(field.endpoint, formData)"
            :mode="mode === 'update' ? 'edition' : 'creation'"
            :uuid="objectId"
            :patchEndpoint="modelInstance ? modelInstance.constructor.getApiEndpoint('PATCH') : ''"
            :fieldName="fieldName"
            :displayField="field.displayField"
            :valueField="field.valueField"
            @update:success="handleFieldSuccess"
          />
          
          <!-- Éditeur de texte riche -->
          <sRichTextEditor
            v-else-if="field.type === 'sRichTextEditor'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :edition="mode === 'update'"
            :uuid="objectId"
            :apiEndpoint="modelInstance ? modelInstance.constructor.getApiEndpoint('PATCH') : ''"
            :fieldName="fieldName"
            @update:success="handleFieldSuccess"
          />
          
          <!-- Champ de recherche filtré -->
          <sFilteredSearchField
            v-else-if="field.type === 'sFilteredSearchField'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :endpoint="getEndpoint(field.endpoint, formData)"
            :displayField="field.displayField"
            :displayFieldAtInitInEditMode="field.displayFieldAtInitInEditMode"
            :valueField="field.valueField"
            :columnsConfig="field.columnsConfig"
            :editMode="mode === 'update'"
            :patchEndpoint="modelInstance ? modelInstance.constructor.getApiEndpoint('PATCH') : ''"
            :fieldName="fieldName"
            :uuid="objectId"
            :ticketData="formData"
            @update:modelValue="handleFieldChange(fieldName, $event)"
            :resetable="field.resetable"
          />
          
          <!-- Liste de sélection -->
          <sPickList
            v-else-if="field.type === 'sPickList'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :helperText="field.helperText ? $t(field.helperText) : null"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :sourceEndPoint="getEndpoint(field.sourceEndPoint, formData)"
            :displayedLabel="field.displayedLabel"
            :targetEndPoint="getEndpoint(field.targetEndPoint, formData)"
            :target_uuid="objectId"
            :edition="mode === 'update'"
            :pickedItems="formData[fieldName]"
            :ressourceEndPoint="field.ressourceEndPoint"
            :fieldName="field.fieldName"
            :visible="typeof field.visible === 'function' ? field.visible(formData) : (field.visible !== undefined ? field.visible : true)"
          />
          
          <!-- Sélecteur de date -->
          <sDatePicker
            v-else-if="field.type === 'sDatePicker'"
            v-model="formData[fieldName]"
            :uuid="objectId"
            :patchendpoint="getEndpoint(field.patchendpoint, formData)"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :helperText="field.helperText ? $t(field.helperText) : null"
            :disabled="field.disabled"
            :edition="mode === 'update'"
            :fieldName="fieldName"
          />
          
          <!-- Champ de bascule -->
          <sToggleField
            v-else-if="field.type === 'sToggleField'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
          />
          
          <!-- Uploader de fichiers -->
          <sFileUploader
            v-else-if="field.type === 'sFileUploader'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :uuid="objectId"
            :edition="mode === 'update'"
            :fieldName="field.fieldName"
          />
          
          <!-- Liste de tags -->
          <sTagsList
            v-else-if="field.type === 'sTagsList'"
            v-model="formData[fieldName]"
            :label="field.label ? $t(field.label) : null"
            :required="field.required"
            :placeholder="field.placeholder ? $t(field.placeholder) : null"
            :helperText="field.helperText ? $t(field.helperText) : null"
            :comboBox="field.comboBox || false"
            :sourceEndPoint="getEndpoint(field.sourceEndPoint, formData)"
            :displayedLabel="field.displayedLabel || 'name'"
            :fieldName="fieldName"
            :edition="mode === 'update'"
            :uuid="objectId"
            :patchEndpoint="modelInstance ? modelInstance.constructor.getApiEndpoint('PATCH') : ''"
            @update:success="handleFieldSuccess"
            :attributeSentToServer="field.attributeSentToServer"
          />
        </template>
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
import sTagsList from '@/components/common/sTagsList.vue';
import AuditTable from '@/components/common/auditTable.vue';

// Import du service API
import apiService from '@/services/apiService';

const { t } = useI18n();

// Initialisation du store des onglets
const tabsStore = useTabsStore();

// Props du composant
const props = defineProps({
  mode: {
    type: String,
    default: 'creation',
    validator: (value) => ['creation', 'update'].includes(value)
  },
  objectClass: {
    type: Function,
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
})

// Debug des props reçues
console.log('[ObjectCreationsAndUpdates] Props reçues:');
console.log('  - mode:', props.mode);
console.log('  - objectClass:', props.objectClass);
console.log('  - objectClass type:', typeof props.objectClass);
console.log('  - objectClass name:', props.objectClass?.name);
console.log('  - objectId:', props.objectId);
console.log('  - tabId:', props.tabId);

// Emits
const emit = defineEmits(['saved', 'error', 'close-tab']);

// État local
const formData = ref({});
const loading = ref(false);
const error = ref(null);
const modelInstance = ref(null);
const auditData = ref([]);
const validationErrors = ref({});
const formFields = ref({});

// Computed properties
const title = computed(() => {
  // Dériver le nom du type depuis la classe
  const objectTypeName = getObjectTypeFromClass(props.objectClass);
  
  if (props.mode === 'creation') {
    return t(`objectCreationsAndUpdates.${objectTypeName}Creation`);
  } else {
    return `${t(`objectCreationsAndUpdates.${objectTypeName}Update`)} (${props.objectId || ''})`;
  }
});

// Fonction utilitaire pour dériver le nom du type depuis la classe
const getObjectTypeFromClass = (ModelClass) => {
  if (!ModelClass) return 'unknown';
  
  const className = ModelClass.name.toLowerCase();
  // Mapping des noms de classes vers les noms de types utilisés dans les traductions
  const classToTypeMap = {
    'incident': 'incident',
    'entity': 'entity', 
    'task': 'task',
    'problem': 'problem',
    'change': 'change',
    'knowledge_article': 'knowledge',
    'project': 'project',
    'sprint': 'sprint',
    'epic': 'epic',
    'story': 'story',
    'defect': 'defect',
    'symptom': 'symptom'
  };
  
  return classToTypeMap[className] || className;
};

// Fonction pour charger les champs de formulaire de manière asynchrone
const loadFormFields = async () => {
  if (!modelInstance.value) return;
  
  const objectTypeName = getObjectTypeFromClass(props.objectClass);
  
  try {
    // Récupérer les champs rendables du modèle
    if (typeof modelInstance.value.constructor.getRenderableFields === 'function') {
      console.log(`[loadFormFields] Chargement des champs pour ${objectTypeName}`);
      const fields = await modelInstance.value.constructor.getRenderableFields('for_edition');
      formFields.value = fields;
      console.log(`[loadFormFields] Champs chargés avec succès:`, Object.keys(fields));
    } else {
      console.warn(`[loadFormFields] La méthode getRenderableFields n'existe pas pour ${objectTypeName}`);
      formFields.value = {};
    }
  } catch (err) {
    console.error(`[loadFormFields] Erreur lors du chargement des champs: ${err.message}`, err);
    formFields.value = {};
    error.value = err.message || t('errors.loadFormFields');
  }
};

// Méthodes
const initializeModel = () => {
  const ModelClass = props.objectClass;
  if (ModelClass) {
    modelInstance.value = new ModelClass();
    // Initialiser formData avec les valeurs par défaut du modèle
    formData.value = { ...modelInstance.value };
    console.log(`[objectCreationsAndUpdates] Modèle initialisé pour la classe: ${ModelClass.name}`);
  } else {
    const objectTypeName = getObjectTypeFromClass(props.objectClass);
    console.error(`[objectCreationsAndUpdates] Classe de modèle non trouvée: ${objectTypeName}`);
    error.value = `No model class found for type: ${objectTypeName}`;
  }
};

const fetchObjectData = async () => {
  if (props.mode !== 'update' || !props.objectId) return;
  
  try {
    loading.value = true;
    
    // Utiliser directement la classe du modèle passée en prop
    const ModelClass = props.objectClass;
    if (!ModelClass) {
      const objectTypeName = getObjectTypeFromClass(props.objectClass);
      throw new Error(`No model class found for type: ${objectTypeName}`);
    }
    
    const objectTypeName = getObjectTypeFromClass(ModelClass);
    console.log(`[fetchObjectData] Utilisation de la classe ${ModelClass.name} pour ${objectTypeName}`);
    
    // Utiliser la méthode getById du modèle si elle existe, sinon utiliser l'approche par défaut
    if (typeof ModelClass.getById === 'function') {
      console.log(`[fetchObjectData] Using getById for ${objectTypeName} with ID: ${props.objectId}`);
      modelInstance.value = await ModelClass.getById(props.objectId);
    } else {
      console.log(`[fetchObjectData] Using direct API call for ${objectTypeName} with ID: ${props.objectId}`);
      const endpoint = `${objectTypeName}s/${props.objectId}`;
      const data = await apiService.get(endpoint);
      modelInstance.value = new ModelClass(data);
    }
    
    formData.value = { ...modelInstance.value };
    
    // Charger les champs du formulaire après avoir récupéré l'instance du modèle
    await loadFormFields();
  } catch (err) {
    console.error(`[objectCreationsAndUpdates] Erreur lors de la récupération des données: ${err.message}`, err);
    error.value = err.message || t('errors.fetchData');
    emit('error', error.value);
  } finally {
    loading.value = false;
  }
};

/**
 * Vérifie si tous les champs requis sont remplis
 * @returns {boolean} - true si tous les champs requis sont remplis, false sinon
 */
const checkRequiredFields = () => {
  console.log('[checkRequiredFields] Vérification des champs requis');
  
  // Récupérer les champs requis
  const requiredFields = Object.entries(formFields.value)
    .filter(([_, field]) => field.required)
    .map(([fieldName, field]) => ({ name: fieldName, label: field.label }));
  
  console.log('[checkRequiredFields] Champs requis identifiés:', requiredFields);
  console.log('[checkRequiredFields] Données du formulaire:', formData.value);
  
  // Réinitialiser les erreurs de validation
  validationErrors.value = {};
  
  // Vérifier si chaque champ requis est rempli
  let missingFields = [];
  
  requiredFields.forEach(field => {
    console.log(`[checkRequiredFields] Vérification du champ '${field.name}' avec valeur:`, formData.value[field.name]);
    const value = formData.value[field.name];
    
    // Vérifier si la valeur est vide (null, undefined, chaîne vide, ou tableau vide)
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      console.warn(`[checkRequiredFields] Champ requis '${field.name}' est vide`);
      missingFields.push(field);
      
      // Ajouter une erreur de validation pour ce champ
      validationErrors.value[field.name] = `Le champ "${field.label}" est requis`;
    }
  });
  
  if (missingFields.length > 0) {
    console.warn(`[checkRequiredFields] ${missingFields.length} champs requis sont manquants:`, missingFields);
    
    // Construire un message d'erreur avec la liste des champs manquants
    const fieldLabels = missingFields.map(field => field.label).join(', ');
    // Utiliser le même format que dans objectStore.js pour afficher la liste des champs manquants
    error.value = `${t('errors.identificationLabel')} - ${t('errors.requiredFields')} ${fieldLabels}`;
    
    return false;
  }
  
  console.log('[checkRequiredFields] Tous les champs requis sont remplis');
  return true;
};

/**
 * Upload les fichiers en attente pour un objet nouvellement créé
 * @param {string} objectUuid - UUID de l'objet créé
 * @param {Array} files - Liste des fichiers à uploader
 * @returns {Promise<Array>} - Liste des fichiers uploadés
 */
const uploadPendingAttachments = async (objectUuid, files) => {
  try {
    console.log(`[uploadPendingAttachments] Uploading ${files?.length || 0} pending attachments for object ${objectUuid}`);
    
    if (!files || !files.length || !objectUuid) {
      console.warn('[uploadPendingAttachments] No files to upload or missing objectUuid');
      return [];
    }
    
    // Préparer le FormData pour l'upload multiple
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    const objectTypeName = getObjectTypeFromClass(props.objectClass);
    formData.append('objectType', objectTypeName.toUpperCase());
    formData.append('objectUuid', objectUuid);
    
    // Si le modèle a un writer_uuid, l'utiliser comme uploadedBy
    if (modelInstance.value.writer_uuid) {
      formData.append('uploadedBy', modelInstance.value.writer_uuid);
    }
    
    // Logs pour vérifier le contenu du FormData
    console.log('[uploadPendingAttachments] FormData content: objectType:', objectTypeName.toUpperCase());
    console.log('[uploadPendingAttachments] FormData content: objectUuid:', objectUuid);
    
    // Appeler le service API pour l'upload
    const response = await apiService.uploadFormData('attachments/upload-multiple', formData);
    console.log('[uploadPendingAttachments] Attachments uploaded successfully:', response);
    
    return response.attachments || [];
  } catch (err) {
    console.error('[uploadPendingAttachments] Error uploading attachments:', err);
    error.value = `Erreur lors de l'upload des pièces jointes: ${err.message}`;
    return [];
  }
};

/**
 * Gère la sauvegarde de l'objet (création ou mise à jour)
 */
const handleSave = async () => {
  console.log('[handleSave] Début de la fonction handleSave');
  try {
    // Réinitialiser les erreurs
    error.value = null;
    
    // Vérifier que tous les champs requis sont remplis
    if (!checkRequiredFields()) {
      console.error('[handleSave] Erreur: champs requis manquants');
      tabsStore.setMessage(error.value);
      return;
    }
    
    console.log('[handleSave] Tous les champs requis sont remplis, activation du chargement');
    loading.value = true;
    
    // Mettre à jour l'instance du modèle avec les données du formulaire
    console.log('[handleSave] Instance du modèle avant mise à jour:', JSON.stringify(modelInstance.value));
    Object.assign(modelInstance.value, formData.value);
    console.log('[handleSave] Instance du modèle après mise à jour:', JSON.stringify(modelInstance.value));
    
    // Préparer les données pour l'API
    console.log('[handleSave] Préparation des données pour l\'API');
    // Convertir le mode en méthode HTTP appropriée
    const httpMethod = props.mode === 'creation' ? 'POST' : 'PUT';
    console.log(`[handleSave] Mode: ${props.mode}, méthode HTTP: ${httpMethod}`);
    const apiData = modelInstance.value.toAPI ? modelInstance.value.toAPI(httpMethod) : formData.value;
    console.log('[handleSave] Données préparées pour l\'API:', apiData);
    
    let response;
    
    // Obtenir l'endpoint à partir de la méthode statique getApiEndpoint du modèle
    let endpoint;
    const ModelClass = props.objectClass;
    const objectTypeName = getObjectTypeFromClass(ModelClass);
    
    console.log(`[handleSave] DEBUG - props.objectClass:`, ModelClass);
    console.log(`[handleSave] DEBUG - ModelClass type:`, typeof ModelClass);
    console.log(`[handleSave] DEBUG - ModelClass.name:`, ModelClass?.name);
    console.log(`[handleSave] DEBUG - ModelClass.getApiEndpoint:`, typeof ModelClass?.getApiEndpoint);
    console.log(`[handleSave] DEBUG - objectTypeName dérivé:`, objectTypeName);
    
    if (props.mode === 'creation') {
      // Utiliser directement la classe du modèle passée en prop
      if (ModelClass && typeof ModelClass.getApiEndpoint === 'function') {
        endpoint = ModelClass.getApiEndpoint();
        console.log(`[handleSave] Endpoint obtenu via getApiEndpoint pour ${objectTypeName}: ${endpoint}`);
      } else {
        // Fallback au cas où la méthode getApiEndpoint n'existe pas
        endpoint = `${objectTypeName}s`;
        console.log(`[handleSave] Méthode getApiEndpoint non disponible pour ${objectTypeName}, utilisation du fallback: ${endpoint}`);
      }
    } else {
      // Pour les mises à jour, on ajoute l'ID à l'endpoint
      if (ModelClass && typeof ModelClass.getApiEndpoint === 'function') {
        const baseEndpoint = ModelClass.getApiEndpoint();
        endpoint = `${baseEndpoint}/${props.objectId}`;
        console.log(`[handleSave] Mode mise à jour pour ${objectTypeName}, endpoint: ${endpoint}`);
      } else {
        endpoint = `${objectTypeName}s/${props.objectId}`;
        console.log(`[handleSave] Mode mise à jour fallback pour ${objectTypeName}, endpoint: ${endpoint}`);
      }
    }
    
    // Vérifier s'il y a des pièces jointes à uploader dans formData
    let pendingAttachments = [];
    
    // Vérifier si attachments existe dans l'objet formData
    if (formData.value && formData.value.attachments && 
        Array.isArray(formData.value.attachments) && 
        formData.value.attachments.length > 0) {
      
      // Filtrer pour ne garder que les fichiers qui n'ont pas d'UUID (non encore uploadés)
      pendingAttachments = formData.value.attachments.filter(file => !file.uuid);
      
      if (pendingAttachments.length > 0) {
        console.log(`[handleSave] Found ${pendingAttachments.length} pending attachments in formData`);
      }
    }
    
    // Créer ou mettre à jour l'objet via l'API
    if (props.mode === 'creation') {
      console.log(`[handleSave] Mode création, appel POST vers l'endpoint: ${endpoint}`);
      response = await apiService.post(endpoint, apiData);
    } else {
      console.log(`[handleSave] Mode mise à jour, appel PUT vers l'endpoint: ${endpoint}`);
      response = await apiService.put(endpoint, apiData);
    }
    
    console.log('[handleSave] Réponse de l\'API:', response);
    
    // Si des fichiers sont en attente et que nous avons un UUID, les uploader
    if (pendingAttachments.length > 0 && response && response.uuid) {
      console.log(`[handleSave] Uploading ${pendingAttachments.length} pending attachments for object ${response.uuid}`);
      try {
        await uploadPendingAttachments(response.uuid, pendingAttachments);
        console.log('[handleSave] Attachments uploaded successfully');
      } catch (uploadError) {
        console.error('[handleSave] Error uploading attachments:', uploadError);
        // Continuer même en cas d'erreur d'upload des pièces jointes
      }
    }
    
    // Émettre l'événement de succès
    console.log('[handleSave] Émission de l\'événement saved');
    emit('saved', response);
    
    // Afficher un message de confirmation via le store
    console.log(`[handleSave] Affichage du message de confirmation: ${t(`${objectTypeName}.saveSuccess`)}`);
    tabsStore.setMessage(t(`${objectTypeName}.saveSuccess`));
    
    // Fermer l'onglet
    console.log(`[handleSave] Fermeture de l'onglet avec l'ID: ${props.tabId}`);
    tabsStore.closeTab(props.tabId);
    console.log('[handleSave] Onglet fermé avec succès');
  } catch (err) {
    console.error(`[handleSave] Erreur lors de la sauvegarde: ${err.message}`, err);
    console.error('[handleSave] Stack trace:', err.stack);
    error.value = err.message || t('errors.saveData');
    console.log(`[handleSave] Message d'erreur défini: ${error.value}`);
    emit('error', error.value);
    console.log('[handleSave] Événement d\'erreur émis');
    
    // Afficher un message d'erreur via le store
    console.log(`[handleSave] Affichage du message d'erreur: ${error.value}`);
    tabsStore.setMessage(error.value);
  } finally {
    console.log('[handleSave] Fin du traitement, désactivation du chargement');
    loading.value = false;
  }
};

const handleFieldChange = (fieldName, value) => {
  formData.value[fieldName] = value;
  
  // Mettre à jour l'objet dans le store
  const objectTypeName = getObjectTypeFromClass(props.objectClass);
  tabsStore.updateObjectInEditing(props.tabId, {
    objectType: objectTypeName,
    objectId: props.objectId,
    data: { ...formData.value }
  });
};

const handleFieldSuccess = () => {
  // Mettre à jour l'objet dans le store après une modification réussie
  const objectTypeName = getObjectTypeFromClass(props.objectClass);
  tabsStore.updateObjectInEditing(props.tabId, {
    objectType: objectTypeName,
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
  
  // Si nous sommes en mode création, charger les champs du formulaire
  if (props.mode === 'creation') {
    await loadFormFields();
  }
  
  // Si c'est un nouvel objet, initialiser dans le store
  if (props.mode === 'creation') {
    const objectTypeName = getObjectTypeFromClass(props.objectClass);
    tabsStore.setObjectInEditing(props.tabId, {
      objectType: objectTypeName,
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
