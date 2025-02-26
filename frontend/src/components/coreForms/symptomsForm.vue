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
const emit = defineEmits(['cancel', 'saved', 'error', 'close-tab']);

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
  // Émettre un événement pour fermer l'onglet actuel
  emit('close-tab', props.data.symptomCode);
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
    
    // Vérifier qu'il y a au moins une traduction
    if (Object.keys(symptomData.value.name).length === 0) {
      throw new Error(t('errors.noTranslations'));
    }
    
    // Pour chaque langue, mettre à jour la traduction si l'UUID existe ET si la valeur a changé
    const updatePromises = [];
    let modifiedCount = 0;
    
    for (const [langue, libelle] of Object.entries(symptomData.value.name)) {
      if (libelle && libelle.trim() !== '') {
        const uuid = symptomData.value.translationUuids[langue];
        const originalValue = symptomData.value.originalValues[langue];
        
        // Si on a un UUID pour cette langue ET que la valeur a changé, on met à jour la traduction
        if (uuid && libelle !== originalValue) {
          console.log(`Mise à jour de la traduction pour la langue ${langue}: "${originalValue}" -> "${libelle}"`);
          modifiedCount++;
          
          updatePromises.push(
            apiService.put(`symptoms_translations/${uuid}`, { libelle })
          );
        } 
        // Si on a un UUID mais que la valeur n'a pas changé, on ne fait rien
        else if (uuid) {
          console.log(`Aucun changement pour la traduction en ${langue}, pas de mise à jour nécessaire`);
        }
        // Sinon, c'est une nouvelle traduction, on la crée via l'API POST
        else {
          // Créer une nouvelle traduction pour cette langue
          // Cette fonctionnalité n'est pas encore implémentée
          console.warn(`Pas d'UUID pour la langue ${langue}, la création de nouvelles traductions n'est pas encore implémentée`);
        }
      }
    }
    
    // Si aucune traduction n'a été modifiée, on informe l'utilisateur et on termine
    if (modifiedCount === 0) {
      loading.value = false;
      alert(t('symptoms.noChanges'));
      return;
    }
    
    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises);
    
    // Mettre à jour les valeurs originales avec les nouvelles valeurs
    for (const [langue, libelle] of Object.entries(symptomData.value.name)) {
      if (symptomData.value.translationUuids[langue]) {
        symptomData.value.originalValues[langue] = libelle;
      }
    }
    
    // Si succès, émission de l'événement saved
    emit('saved', { success: true, modifiedCount });
    
    // Message de confirmation
    alert(`${modifiedCount} ${modifiedCount > 1 ? t('symptoms.translationsUpdated') : t('symptoms.translationUpdated')}`);
  } catch (err) {
    console.error('Erreur lors de la mise à jour des traductions:', err);
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
    // Mode édition
    handleUpdate();
  } else {
    // Mode création
    handleSave();
  }
};


// Initialisation du composant
onMounted(async () => {
  await fetchActiveLanguages();
  if (symptomCode.value) {
    await fetchSymptomData();
  } else {
    // Initialisation des champs multilingues avec les langues actives
    const initialName = {};
    activeLanguages.value.forEach(lang => {
      initialName[lang] = '';
    });
    symptomData.value.name = initialName;
  }
});
</script>
