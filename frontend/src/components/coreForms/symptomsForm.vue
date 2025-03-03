<template>
  <div class="symptoms-form">
    <div class="symptoms-form__header">
      <h2>{{ title }}</h2>
    </div>
    
    <div class="symptoms-form__content">
      <!-- Champ libre avec langue active -->
      <MLTextField
        v-model="symptomData.name"
        :languages="activeLanguages"
        :label="$t('symptoms.name')"
        :required="true"
      />
      
      <!-- Champs texte standard -->
      <TextField
        v-model="symptomData.code"
        :label="$t('symptoms.code')"
        :required="true"
      />
    </div>
    
    <div class="symptoms-form__footer">
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
import TextField from '@/components/common/TextField.vue';
import MLTextField from '@/components/common/MLTextField.vue';
import ButtonStandard from '@/components/common/ButtonStandard.vue';

// Import du service API
import apiService from '@/services/apiService';

// Import des styles
import '@/assets/styles/symptomsForm.css';

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
  name: {},
  code: '',
  translationUuids: {}, // Stockage des UUIDs par langue
  originalValues: {}    // Stockage des valeurs originales pour détecter les changements
});
const activeLanguages = ref([]);
const loading = ref(false);
const error = ref(null);

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
    // Le backend renvoie { code, translations: [{ uuid, langue, libelle }] }
    // Le frontend attend { code, name: { fr: "libellé", en: "label" }, translationUuids: { fr: "uuid1", en: "uuid2" }, originalValues: { fr: "libellé", en: "label" } }
    const transformedData = {
      code: data.code || '',
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
        apiService.put(`symptoms/translations/${update.uuid}`, {
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
@import '@/assets/styles/symptomsForm.css';
</style>
