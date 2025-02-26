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
        @click="handleSave"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { API_BASE_URL } from '@/config/config';

// Import des composants
import TextField from '@/components/common/TextField.vue';
import MLTextField from '@/components/common/MLTextField.vue';
import ButtonStandard from '@/components/common/ButtonStandard.vue';

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
  code: ''
});
const activeLanguages = ref([]);
const loading = ref(false);
const error = ref(null);

// Récupération des langues actives depuis l'API
const fetchActiveLanguages = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/languages?is_active=yes`);
    
    // Vérifier si la réponse est OK (statut 2xx)
    if (!response.ok) {
      // Essayer de récupérer le message d'erreur du serveur
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
      } catch (e) {
        // Si on ne peut pas parser la réponse JSON, utiliser un message basé sur le code HTTP
        errorMessage = getHttpErrorMessage(response.status);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
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
    const response = await fetch(`${API_BASE_URL}/symptoms/by-scode?scode=${encodeURIComponent(symptomCode.value)}`);
    
    // Vérifier si la réponse est OK (statut 2xx)
    if (!response.ok) {
      // Essayer de récupérer le message d'erreur du serveur
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
      } catch (e) {
        // Si on ne peut pas parser la réponse JSON, utiliser un message basé sur le code HTTP
        errorMessage = getHttpErrorMessage(response.status);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
    // Transformer les données reçues du backend au format attendu par le frontend
    // Le backend renvoie { code, translations: [{ langue, libelle }] }
    // Le frontend attend { code, name: { fr: "libellé", en: "label" } }
    const transformedData = {
      code: data.code || '',
      name: {}
    };
    
    // Convertir les traductions en format attendu par le frontend
    if (data.translations && Array.isArray(data.translations)) {
      data.translations.forEach(translation => {
        if (translation.langue && translation.libelle) {
          transformedData.name[translation.langue] = translation.libelle;
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

// Gestion de la sauvegarde
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
    
    // Appel API PUT pour créer/mettre à jour le symptôme
    const response = await fetch(`${API_BASE_URL}/symptoms`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transformedData)
    });
    
    // Vérifier si la réponse est OK (statut 2xx)
    if (!response.ok) {
      // Essayer de récupérer le message d'erreur du serveur
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Erreur ${response.status}`;
      } catch (e) {
        // Si on ne peut pas parser la réponse JSON, utiliser un message basé sur le code HTTP
        errorMessage = getHttpErrorMessage(response.status);
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    
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

// Fonction utilitaire pour obtenir un message d'erreur basé sur le code HTTP
const getHttpErrorMessage = (statusCode) => {
  switch (statusCode) {
    case 400:
      return t('errors.badRequest');
    case 401:
      return t('errors.unauthorized');
    case 403:
      return t('errors.forbidden');
    case 404:
      return t('errors.notFound');
    case 409:
      return t('errors.conflict');
    case 422:
      return t('errors.validationError');
    case 500:
      return t('errors.serverError');
    case 503:
      return t('errors.serviceUnavailable');
    default:
      return `Erreur HTTP: ${statusCode}`;
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

<style scoped>
.symptoms-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--background-color);
  max-width: 800px;
  margin: 0 auto;
}

.symptoms-form__header {
  margin-bottom: 1rem;
}

.symptoms-form__content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.symptoms-form__footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color-light);
}

h2 {
  font-size: 1.5rem;
  color: var(--text-color-primary);
  margin: 0;
}

/* Animations de transition */
.symptoms-form__content > * {
  transition: all 0.3s ease;
}

.symptoms-form__content > *:hover {
  transform: translateY(-2px);
}

.symptoms-form__footer button {
  transition: all 0.2s ease;
}

.symptoms-form__footer button:hover {
  transform: scale(1.05);
}
</style>
