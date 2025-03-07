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
        <button
          class="s-select-field__action-btn s-select-field__action-btn--confirm"
          @click="handleConfirmEdit"
          :disabled="isUpdating"
          :aria-label="t('common.confirm_edit')"
        >
          ✓
        </button>
        <button
          class="s-select-field__action-btn s-select-field__action-btn--cancel"
          @click="handleCancelEdit"
          :disabled="isUpdating"
          :aria-label="t('common.cancel_edit')"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/assets/styles/sSelectField.css'
import apiService from '@/services/apiService'

export default {
  name: 'SSelectField',
  props: {
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
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const options = ref([])
    const selectedValue = ref(props.initialValue)
    const originalValue = ref(props.initialValue)
    const loadingOptions = ref(false)
    const editing = ref(false)
    const isUpdating = ref(false)
    const optionsLoaded = ref(false)

    const fetchOptions = async () => {
      if (optionsLoaded.value) return

      try {
        loadingOptions.value = true
        const response = await apiService.get(props.optionsEndpoint)
        options.value = response
        optionsLoaded.value = true
      } catch (error) {
        console.error('Error loading options:', error)
        emit('error', 'Failed to load options')
      } finally {
        loadingOptions.value = false
      }
    }

    const handleChange = () => {
      if (props.mode === 'edition' && selectedValue.value !== originalValue.value) {
        editing.value = true
      }
      emit('change', selectedValue.value)
    }

    const handleConfirmEdit = async () => {
      if (!props.uuid || !props.patchEndpoint) {
        console.error('Missing uuid or patchEndpoint for edit mode')
        return
      }

      try {
        isUpdating.value = true
        await apiService.patch(props.patchEndpoint, props.uuid, {
          value: selectedValue.value
        })
        
        originalValue.value = selectedValue.value
        editing.value = false
        emit('update:success')
      } catch (error) {
        console.error('Error updating value:', error)
        selectedValue.value = originalValue.value
        editing.value = false
        emit('update:error', error)
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
      if (props.initialValue) {
        selectedValue.value = props.initialValue
        originalValue.value = props.initialValue
      }
      fetchOptions()
    })

    return {
      options,
      selectedValue,
      loadingOptions,
      editing,
      isUpdating,
      handleChange,
      handleConfirmEdit,
      handleCancelEdit,
      t
    }
  }
}
</script>

<style scoped>
/* Styles are imported from sSelectField.css */
</style>
