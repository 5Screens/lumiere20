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
      symptomId: null
    })
  }
});

// Computed properties pour extraire les données du props data
const title = computed(() => props.data?.title || 'Symptôme');
const symptomId = computed(() => props.data?.symptomId || null);

// Emits
const emit = defineEmits(['cancel', 'saved', 'error']);

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
    const data = await response.json();
    activeLanguages.value = data.map(lang => lang.code);
  } catch (err) {
    console.error('Erreur lors de la récupération des langues actives:', err);
    error.value = 'Impossible de charger les langues actives';
    emit('error', 'Impossible de charger les langues actives');
  }
};

// Chargement des données du symptôme si on est en mode édition
const fetchSymptomData = async () => {
  if (!symptomId.value) return;
  
  try {
    loading.value = true;
    const response = await fetch(`${API_BASE_URL}/symptoms/${symptomId.value}`);
    const data = await response.json();
    symptomData.value = data;
  } catch (err) {
    console.error('Erreur lors de la récupération des données du symptôme:', err);
    error.value = 'Impossible de charger les données du symptôme';
    emit('error', 'Impossible de charger les données du symptôme');
  } finally {
    loading.value = false;
  }
};

// Gestion de l'annulation
const handleCancel = () => {
  // Retour à l'écran précédent
  emit('cancel');
};

// Gestion de la sauvegarde
const handleSave = async () => {
  try {
    loading.value = true;
    
    // Appel API PUT pour créer/mettre à jour le symptôme
    const response = await fetch(`${API_BASE_URL}/symptoms`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(symptomData.value)
    });
    const data = await response.json();
    
    // Si succès, émission de l'événement saved
    emit('saved', data);
    
    // Message de confirmation
    alert(t('symptoms.saveSuccess'));
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du symptôme:', err);
    error.value = 'Erreur lors de la sauvegarde';
    emit('error', 'Erreur lors de la sauvegarde');
    
    // Message d'erreur
    alert(t('symptoms.saveError'));
  } finally {
    loading.value = false;
  }
};

// Initialisation du composant
onMounted(async () => {
  await fetchActiveLanguages();
  if (symptomId.value) {
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
