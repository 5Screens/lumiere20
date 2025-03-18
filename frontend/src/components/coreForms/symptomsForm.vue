<template>
  <div class="form">
    <div class="form__header">
      <div class="form__header-actions">
        <ButtonStandard
          icon="fas fa-save"
          variant="primary"
          :loading="loading"
          @click="handleAction"
          :title="$t('common.save')"
          label=""
        />
      </div>
    </div>
      
      <!-- Champs texte standard -->
      <TextField
        v-model="symptomData.code"
        :label="$t('symptoms.code')"
        :required="true"
      />
          
    <div class="form__content">
      <!-- Champ libre avec langue active -->
      <MLTextField
        v-model="symptomData.name"
        :languages="activeLanguages"
        :label="$t('symptoms.name')"
        :required="true"
      />

      
      <!-- Tableau d'audit pour afficher l'historique des modifications -->
      <AuditTable 
        v-if="symptomData.uuid || hasTranslationUuids" 
        :objectUuid="symptomData.uuid"
        :objectUuids="translationUuidsArray"
      />
    </div>
    
    <div class="form__footer">
      <!-- Le bouton Enregistrer a été déplacé dans le header et le bouton Annuler a été supprimé -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';

// Import des composants
import TextField from '@/components/common/TextField.vue';
import MLTextField from '@/components/common/MLTextField.vue';
import ButtonStandard from '@/components/common/ButtonStandard.vue';
import AuditTable from '@/components/common/auditTable.vue';

// Import du service API
import apiService from '@/services/apiService';

const { t } = useI18n();

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      title: 'Symptôme',
      symptomCode: null
    })
  }
});

// Computed properties pour extraire les données du props data
const title = computed(() => props.data?.title || 'Symptôme');
const symptomCode = computed(() => props.data?.symptomCode || null);

// Emits
const emit = defineEmits(['cancel', 'saved', 'error', 'close-tab', 'close-child-tab']);

// État local
const symptomData = ref({
  uuid: '',
  name: {},
  code: '',
  translationUuids: {}, // Stockage des UUIDs par langue
  originalValues: {}    // Stockage des valeurs originales pour détecter les changements
});
const activeLanguages = ref([]);
const loading = ref(false);
const error = ref(null);

// Computed property pour vérifier si des UUID de traductions existent
const hasTranslationUuids = computed(() => Object.keys(symptomData.value.translationUuids).length > 0);

// Computed property pour convertir les UUID de traductions en tableau
const translationUuidsArray = computed(() => Object.values(symptomData.value.translationUuids));

// Récupération des langues actives depuis l'API
const fetchActiveLanguages = async () => {
  try {
    const data = await apiService.get('languages', { is_active: 'yes' });
    activeLanguages.value = data.map(lang => lang.code);
  } catch (err) {
    console.error('Erreur lors de la récupération des langues actives:', err);
    error.value = err.message || 'Erreur lors de la récupération des langues actives';
    emit('error', error.value);
    
    // Afficher un message d'erreur à l'utilisateur
    alert(error.value);
  }
};

// Chargement des données du symptôme si on est en mode édition
const fetchSymptomData = async () => {
  if (!symptomCode.value) return;
  
  try {
    loading.value = true;
    const data = await apiService.get('symptoms/by-scode', { scode: symptomCode.value });
    
    // Transformer les données reçues du backend au format attendu par le frontend
    // Le backend renvoie { code, uuid, translations: [{ uuid, langue, libelle }] }
    // Le frontend attend { code, uuid, name: { fr: "libellé", en: "label" }, translationUuids: { fr: "uuid1", en: "uuid2" }, originalValues: { fr: "libellé", en: "label" } }
    const transformedData = {
      code: data.code || '',
      uuid: data.uuid || '', // Stocker l'UUID du symptôme
      name: {},
      translationUuids: {}, // Stockage des UUIDs par langue
      originalValues: {}    // Stockage des valeurs originales pour détecter les changements
    };
    
    // Convertir les traductions en format attendu par le frontend
    if (data.translations && Array.isArray(data.translations)) {
      data.translations.forEach(translation => {
        if (translation.langue && translation.libelle) {
          transformedData.name[translation.langue] = translation.libelle;
          transformedData.translationUuids[translation.langue] = translation.uuid; // Stocker l'UUID
          transformedData.originalValues[translation.langue] = translation.libelle; // Stocker la valeur originale
        }
      });
    }
    
    // Mettre à jour les données du formulaire
    symptomData.value = transformedData;
    
  } catch (err) {
    console.error('Erreur lors de la récupération des données du symptôme:', err);
    error.value = err.message || t('errors.fetchSymptomData');
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

// Gestion de la sauvegarde (création d'un nouveau symptôme uniquement)
const handleSave = async () => {
  try {
    loading.value = true;
    
    // Transformer les données au format attendu par le backend
    const transformedData = {
      code: symptomData.value.code,
      translations: []
    };
    
    // Convertir le format { fr: "texte", en: "text" } en format attendu par l'API
    Object.entries(symptomData.value.name).forEach(([langue, libelle]) => {
      if (libelle && libelle.trim() !== '') {
        transformedData.translations.push({
          langue,
          libelle
        });
      }
    });
    
    // Vérifier qu'il y a au moins une traduction
    if (transformedData.translations.length === 0) {
      throw new Error(t('errors.noTranslations'));
    }
    
    // Appel API POST pour créer un nouveau symptôme
    const data = await apiService.post('symptoms', transformedData);
    
    // Si succès, émission de l'événement saved
    emit('saved', data);
    
    // Message de confirmation
    alert(t('symptoms.saveSuccess'));
    
    // Fermer l'onglet enfant après la sauvegarde
    emit('close-child-tab');
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du symptôme:', err);
    error.value = err.message || 'Erreur lors de la sauvegarde';
    emit('error', error.value);
    
    // Message d'erreur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

// Gestion de la mise à jour des traductions d'un symptôme existant
const handleUpdate = async () => {
  try {
    loading.value = true;
    
    // Transformer les données au format attendu par le backend
    const transformedData = {
      code: symptomData.value.code,
      translations: []
    };
    
    // Préparer les mises à jour de traductions
    const translationUpdates = [];
    
    // Parcourir toutes les langues actives
    Object.entries(symptomData.value.name).forEach(([langue, libelle]) => {
      // Vérifier si la langue a une valeur
      if (libelle && libelle.trim() !== '') {
        // Vérifier si cette langue avait déjà une traduction (a un UUID)
        const uuid = symptomData.value.translationUuids[langue];
        const originalValue = symptomData.value.originalValues[langue];
        
        // Si la traduction existe déjà et a été modifiée, on l'ajoute aux mises à jour
        if (uuid && libelle !== originalValue) {
          translationUpdates.push({
            uuid,
            langue,
            libelle
          });
        } 
        // Si la traduction n'existe pas encore, on l'ajoute aux nouvelles traductions
        else if (!uuid) {
          transformedData.translations.push({
            langue,
            libelle
          });
        }
      }
    });
    
    // Effectuer les mises à jour de traductions existantes
    if (translationUpdates.length > 0) {
      await Promise.all(translationUpdates.map(update => 
        apiService.put(`symptoms_translations/${update.uuid}`, {
          langue: update.langue,
          libelle: update.libelle
        })
      ));
    }
    
    // Ajouter de nouvelles traductions si nécessaire
    if (transformedData.translations.length > 0) {
      await apiService.post(`symptoms/${symptomCode.value}/translations`, transformedData);
    }
    
    // Si succès, émission de l'événement saved
    emit('saved', { code: symptomCode.value });
    
    // Message de confirmation
    alert(t('symptoms.updateSuccess'));
    
    // Fermer l'onglet enfant après la mise à jour
    emit('close-child-tab');
  } catch (err) {
    console.error('Erreur lors de la mise à jour du symptôme:', err);
    error.value = err.message || 'Erreur lors de la mise à jour';
    emit('error', error.value);
    
    // Message d'erreur
    alert(error.value);
  } finally {
    loading.value = false;
  }
};

// Fonction qui détermine quelle action effectuer en fonction du mode (création ou édition)
const handleAction = () => {
  if (symptomCode.value) {
    handleUpdate();
  } else {
    handleSave();
  }
};

// Initialisation du composant
onMounted(async () => {
  await fetchActiveLanguages();
  if (symptomCode.value) {
    await fetchSymptomData();
  }
});
</script>

<style scoped>
@import '@/assets/styles/forms.css';

.form__header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
}

.form__header-actions {
  display: flex;
  gap: 10px;
}
</style>
