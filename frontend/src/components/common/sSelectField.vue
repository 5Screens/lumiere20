<template>
  <div class="s-select-field" :class="{ 'editing': editing }">
    <div class="s-select-field__label-container" v-if="label">
      <label class="s-select-field__label" :class="{ 's-select-field__label--required': required }">
        {{ label }}
      </label>
    </div>
    
    <div class="s-select-field__input-container">
      <select
        v-model="selectedValue"
        @change="handleChange"
        :disabled="loadingOptions"
      >
        <option value="" disabled>{{ loadingOptions ? t('common.loading') : t('common.selectOption') }}</option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>

      <div v-if="loadingOptions" class="spinner" :aria-label="t('common.loading_in_progress')"></div>

      <div v-if="editing && mode === 'edition'" class="s-select-field__actions">
        <RgButton
          @confirm="confirmChange"
          @cancel="handleCancelEdit"
          :disabled="isUpdating"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/assets/styles/sSelectField.css'
import apiService from '@/services/apiService'
import RgButton from './rgButton.vue'

export default {
  name: 'SSelectField',
  components: {
    RgButton
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    mode: {
      type: String,
      required: true,
      validator: value => ['creation', 'edition'].includes(value)
    },
    initialValue: {
      type: String,
      default: ''
    },
    uuid: {
      type: String,
      required: false
    },
    optionsEndpoint: {
      type: String,
      required: true
    },
    patchEndpoint: {
      type: String,
      required: false
    },
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    fieldName: {
      type: String,
      default: 'entity_type'
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const options = ref([])
    const selectedValue = ref(props.modelValue)
    const originalValue = ref(props.modelValue)
    const loadingOptions = ref(false)
    const editing = ref(false)
    const isUpdating = ref(false)
    const optionsLoaded = ref(false)

    // Ajouter un watcher sur modelValue pour mettre à jour selectedValue et originalValue
    // lorsque modelValue change (par exemple lors du chargement asynchrone des données)
    watch(() => props.modelValue, (newValue) => {
      console.info('modelValue changed to:', newValue)
      if (newValue !== undefined && newValue !== null) {
        selectedValue.value = newValue
        originalValue.value = newValue
      }
    })

    const fetchOptions = async () => {
      if (optionsLoaded.value) {
        console.info('Options already loaded, skipping fetch')
        return
      }

      console.info('Fetching options from endpoint:', props.optionsEndpoint)
      try {
        loadingOptions.value = true
        const response = await apiService.get(props.optionsEndpoint)
        console.info('Successfully fetched options:', response)
        options.value = response
        optionsLoaded.value = true
      } catch (error) {
        console.error('Error loading options:', error)
        console.warn('Failed to load options from endpoint:', props.optionsEndpoint)
        emit('error', 'Failed to load options')
      } finally {
        console.info('Options loading state set to:', loadingOptions.value)
        loadingOptions.value = false
      }
    }

    const handleChange = () => {
      if (props.mode === 'edition' && selectedValue.value !== originalValue.value) {
        editing.value = true
      }
      emit('update:modelValue', selectedValue.value)
      emit('change', selectedValue.value)
    }

    const confirmChange = async () => {
      if (!props.uuid || !props.patchEndpoint) {
        console.error('Missing uuid or patchEndpoint for edit mode')
        emit('update:error', {
          success: false,
          error: 'Missing uuid or patchEndpoint'
        })
        return
      }

      try {
        isUpdating.value = true
        // Déterminer le nom du champ à partir du label ou utiliser un nom par défaut
        // Cette approche est générique et fonctionne pour différents types de champs
        const fieldName = props.fieldName || 'entity_type'
        
        // Préparer les paramètres pour la requête PATCH
        const params = {
          uuid: props.uuid
        }
        
        // Ajouter dynamiquement le champ à mettre à jour
        params[fieldName] = selectedValue.value
        
        // Utiliser apiService pour effectuer la requête PATCH
        await apiService.patch(props.patchEndpoint, params)
        
        originalValue.value = selectedValue.value
        editing.value = false
        emit('update:success', {
          success: true,
          value: selectedValue.value
        })
      } catch (error) {
        console.error('Error updating value:', error)
        selectedValue.value = originalValue.value
        editing.value = false
        emit('update:error', {
          success: false,
          value: selectedValue.value,
          error: error.message
        })
      } finally {
        isUpdating.value = false
      }
    }

    const handleCancelEdit = () => {
      selectedValue.value = originalValue.value
      editing.value = false
      emit('update:cancelled')
    }

    onMounted(() => {
      console.info('SSelectField mounted with props:', {
        modelValue: props.modelValue,
        mode: props.mode,
        uuid: props.uuid,
        optionsEndpoint: props.optionsEndpoint,
        fieldName: props.fieldName
      })

      if (props.modelValue) {
        console.info('Initializing with modelValue:', props.modelValue)
        selectedValue.value = props.modelValue
        originalValue.value = props.modelValue
      } else {
        console.info('No initial modelValue provided')
      }
      
      console.info('Starting options fetch...')
      fetchOptions()
    })

    return {
      options,
      selectedValue,
      loadingOptions,
      editing,
      isUpdating,
      handleChange,
      confirmChange,
      handleCancelEdit,
      t
    }
  }
}
</script>

<style scoped>
/* Styles are imported from sSelectField.css */
</style>
