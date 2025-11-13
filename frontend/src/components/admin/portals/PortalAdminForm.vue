<template>
  <div class="portal-admin-form">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <div v-else-if="error" class="error-state">
      <i class="fas fa-exclamation-triangle"></i>
      <p>{{ error }}</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="form">
      <!-- Section: Basic Information -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.basicInfo') }}</h3>
        
        <!-- Code -->
        <div class="form-field">
          <label class="form-label required">{{ $t('portals.admin.code') }}</label>
          <input
            v-model="formData.code"
            type="text"
            class="form-input"
            :class="{ 'error': errors.code }"
            :placeholder="$t('portals.admin.codePlaceholder')"
            pattern="[a-z0-9-]{2,50}"
            maxlength="50"
            required
            @blur="checkCodeUniqueness"
          />
          <p v-if="errors.code" class="error-message">{{ errors.code }}</p>
          <p class="field-hint">{{ $t('portals.admin.codeHint') }}</p>
        </div>

        <!-- Name -->
        <div class="form-field">
          <label class="form-label required">{{ $t('portals.admin.name') }}</label>
          <input
            v-model="formData.name"
            type="text"
            class="form-input"
            :class="{ 'error': errors.name }"
            :placeholder="$t('portals.admin.namePlaceholder')"
            maxlength="150"
            required
          />
          <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
        </div>

        <!-- Base URL -->
        <div class="form-field">
          <label class="form-label required">{{ $t('portals.admin.baseUrl') }}</label>
          <input
            v-model="formData.base_url"
            type="url"
            class="form-input"
            :class="{ 'error': errors.base_url }"
            :placeholder="$t('portals.admin.baseUrlPlaceholder')"
            required
          />
          <p v-if="errors.base_url" class="error-message">{{ errors.base_url }}</p>
        </div>

        <!-- Thumbnail URL -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.thumbnailUrl') }}</label>
          <input
            v-model="formData.thumbnail_url"
            type="url"
            class="form-input"
            :class="{ 'error': errors.thumbnail_url }"
            :placeholder="$t('portals.admin.thumbnailUrlPlaceholder')"
          />
          <p v-if="errors.thumbnail_url" class="error-message">{{ errors.thumbnail_url }}</p>
        </div>

        <!-- View Component -->
        <div class="form-field">
          <label class="form-label required">{{ $t('portals.admin.viewComponent') }}</label>
          <select
            v-model="formData.view_component"
            class="form-select"
            :class="{ 'error': errors.view_component }"
            required
          >
            <option value="PortalViewV1">PortalViewV1</option>
            <option value="PortalPOC">PortalPOC</option>
          </select>
          <p v-if="errors.view_component" class="error-message">{{ errors.view_component }}</p>
        </div>
      </div>

      <!-- Section: Display Configuration -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.displayConfig') }}</h3>

        <!-- Title -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.title') }}</label>
          <input
            v-model="formData.title"
            type="text"
            class="form-input"
            :class="{ 'error': errors.title }"
            :placeholder="$t('portals.admin.titlePlaceholder')"
            maxlength="150"
          />
          <p v-if="errors.title" class="error-message">{{ errors.title }}</p>
        </div>

        <!-- Subtitle -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.subtitle') }}</label>
          <input
            v-model="formData.subtitle"
            type="text"
            class="form-input"
            :class="{ 'error': errors.subtitle }"
            :placeholder="$t('portals.admin.subtitlePlaceholder')"
            maxlength="255"
          />
          <p v-if="errors.subtitle" class="error-message">{{ errors.subtitle }}</p>
        </div>

        <!-- Welcome Template -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.welcomeTemplate') }}</label>
          <input
            v-model="formData.welcome_template"
            type="text"
            class="form-input"
            :class="{ 'error': errors.welcome_template }"
            :placeholder="$t('portals.admin.welcomeTemplatePlaceholder')"
            maxlength="255"
          />
          <p v-if="errors.welcome_template" class="error-message">{{ errors.welcome_template }}</p>
          <p class="field-hint">{{ $t('portals.admin.welcomeTemplateHint') }}</p>
        </div>

        <!-- Logo URL -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.logoUrl') }}</label>
          <input
            v-model="formData.logo_url"
            type="url"
            class="form-input"
            :class="{ 'error': errors.logo_url }"
            :placeholder="$t('portals.admin.logoUrlPlaceholder')"
          />
          <p v-if="errors.logo_url" class="error-message">{{ errors.logo_url }}</p>
        </div>
      </div>

      <!-- Section: Theme -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.theme') }}</h3>

        <!-- Primary Color -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.themePrimaryColor') }}</label>
          <div class="color-input-wrapper">
            <input
              v-model="formData.theme_primary_color"
              type="color"
              class="form-color"
            />
            <input
              v-model="formData.theme_primary_color"
              type="text"
              class="form-input"
              :class="{ 'error': errors.theme_primary_color }"
              :placeholder="$t('portals.admin.colorPlaceholder')"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxlength="7"
            />
          </div>
          <p v-if="errors.theme_primary_color" class="error-message">{{ errors.theme_primary_color }}</p>
        </div>

        <!-- Secondary Color -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.themeSecondaryColor') }}</label>
          <div class="color-input-wrapper">
            <input
              v-model="formData.theme_secondary_color"
              type="color"
              class="form-color"
            />
            <input
              v-model="formData.theme_secondary_color"
              type="text"
              class="form-input"
              :class="{ 'error': errors.theme_secondary_color }"
              :placeholder="$t('portals.admin.colorPlaceholder')"
              pattern="^#[0-9A-Fa-f]{6}$"
              maxlength="7"
            />
          </div>
          <p v-if="errors.theme_secondary_color" class="error-message">{{ errors.theme_secondary_color }}</p>
        </div>
      </div>

      <!-- Section: Features -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.features') }}</h3>

        <!-- Show Chat -->
        <div class="form-field checkbox-field">
          <label class="checkbox-label">
            <input
              v-model="formData.show_chat"
              type="checkbox"
              class="form-checkbox"
            />
            <span>{{ $t('portals.admin.showChat') }}</span>
          </label>
        </div>

        <!-- Show Alerts -->
        <div class="form-field checkbox-field">
          <label class="checkbox-label">
            <input
              v-model="formData.show_alerts"
              type="checkbox"
              class="form-checkbox"
            />
            <span>{{ $t('portals.admin.showAlerts') }}</span>
          </label>
        </div>

        <!-- Chat Default Message -->
        <div class="form-field">
          <label class="form-label">{{ $t('portals.admin.chatDefaultMessage') }}</label>
          <textarea
            v-model="formData.chat_default_message"
            class="form-textarea"
            :class="{ 'error': errors.chat_default_message }"
            :placeholder="$t('portals.admin.chatDefaultMessagePlaceholder')"
            rows="3"
          ></textarea>
          <p v-if="errors.chat_default_message" class="error-message">{{ errors.chat_default_message }}</p>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="saving">
          <i v-if="saving" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-save"></i>
          {{ saving ? $t('common.saving') : $t('common.save') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import apiService from '@/services/apiService'
import { useTabsStore } from '@/stores/tabsStore'

const { t } = useI18n()
const tabsStore = useTabsStore()

const props = defineProps({
  portalUuid: {
    type: String,
    required: true
  }
})

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const errors = ref({})

const formData = ref({
  code: '',
  name: '',
  base_url: '',
  thumbnail_url: '',
  view_component: 'PortalViewV1',
  title: '',
  subtitle: '',
  welcome_template: 'Bienvenue {firstName} !',
  logo_url: '',
  theme_primary_color: '#FF6B00',
  theme_secondary_color: '#111111',
  show_chat: true,
  show_alerts: true,
  chat_default_message: 'En cours d\'implémentation'
})

// Load portal data
onMounted(async () => {
  try {
    loading.value = true
    const portal = await apiService.get(`portals/uuid/${props.portalUuid}`)
    
    // Populate form with portal data
    formData.value = {
      code: portal.code || '',
      name: portal.name || '',
      base_url: portal.base_url || '',
      thumbnail_url: portal.thumbnail_url || '',
      view_component: portal.view_component || 'PortalViewV1',
      title: portal.title || '',
      subtitle: portal.subtitle || '',
      welcome_template: portal.welcome_template || 'Bienvenue {firstName} !',
      logo_url: portal.logo_url || '',
      theme_primary_color: portal.theme_primary_color || '#FF6B00',
      theme_secondary_color: portal.theme_secondary_color || '#111111',
      show_chat: portal.show_chat !== undefined ? portal.show_chat : true,
      show_alerts: portal.show_alerts !== undefined ? portal.show_alerts : true,
      chat_default_message: portal.chat_default_message || 'En cours d\'implémentation'
    }
  } catch (err) {
    console.error('Error loading portal:', err)
    error.value = err.message || t('errors.loadingFailed')
  } finally {
    loading.value = false
  }
})

// Watch for name length validation
watch(() => formData.value.name, (newValue) => {
  if (newValue && newValue.length > 150) {
    errors.value.name = t('errors.portalNameTooLong')
  } else {
    delete errors.value.name
  }
})

// Check code uniqueness
const checkCodeUniqueness = async () => {
  if (!formData.value.code) return

  try {
    const result = await apiService.get('portals/check-code', {
      code: formData.value.code,
      exclude_uuid: props.portalUuid
    })

    if (!result.isUnique) {
      errors.value.code = t('portals.admin.codeAlreadyExists')
    } else {
      delete errors.value.code
    }
  } catch (err) {
    console.error('Error checking code uniqueness:', err)
  }
}

// Validate form
const validateForm = () => {
  errors.value = {}

  // Required fields
  if (!formData.value.code) {
    errors.value.code = t('errors.requiredField')
  } else if (!/^[a-z0-9-]{2,50}$/.test(formData.value.code)) {
    errors.value.code = t('portals.admin.codeInvalid')
  }

  if (!formData.value.name) {
    errors.value.name = t('errors.requiredField')
  } else if (formData.value.name.length > 150) {
    errors.value.name = t('errors.portalNameTooLong')
  }

  if (!formData.value.base_url) {
    errors.value.base_url = t('errors.requiredField')
  }

  if (!formData.value.view_component) {
    errors.value.view_component = t('errors.requiredField')
  }

  // Color validation
  if (formData.value.theme_primary_color && !/^#[0-9A-Fa-f]{6}$/.test(formData.value.theme_primary_color)) {
    errors.value.theme_primary_color = t('portals.admin.colorInvalid')
  }

  if (formData.value.theme_secondary_color && !/^#[0-9A-Fa-f]{6}$/.test(formData.value.theme_secondary_color)) {
    errors.value.theme_secondary_color = t('portals.admin.colorInvalid')
  }

  return Object.keys(errors.value).length === 0
}

// Handle form submit
const handleSubmit = async () => {
  if (!validateForm()) {
    tabsStore.setMessage(t('errors.formValidationFailed'))
    return
  }

  try {
    saving.value = true

    // Prepare data (remove empty strings, convert to null)
    const updateData = {}
    for (const [key, value] of Object.entries(formData.value)) {
      if (value === '') {
        updateData[key] = null
      } else {
        updateData[key] = value
      }
    }

    await apiService.put(`portals/${props.portalUuid}`, updateData)
    
    tabsStore.setMessage(t('portals.admin.updateSuccess'))
    
    // Emit success event (could be used by parent)
    // emit('update:success')
  } catch (err) {
    console.error('Error updating portal:', err)
    tabsStore.setMessage(t('portals.admin.updateError') + ': ' + err.message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.portal-admin-form {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #2196F3);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: #d32f2f;
}

.error-state i {
  font-size: 48px;
  margin-bottom: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-section {
  background: var(--background-primary, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  padding: 24px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #111);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--primary-color, #2196F3);
}

.form-field {
  margin-bottom: 20px;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color, #111);
  margin-bottom: 8px;
}

.form-label.required::after {
  content: ' *';
  color: #d32f2f;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  font-size: 0.875rem;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  background: var(--background-primary, #fff);
  color: var(--text-color, #111);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #2196F3);
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.form-input.error,
.form-select.error,
.form-textarea.error {
  border-color: #d32f2f;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.color-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.form-color {
  width: 60px;
  height: 40px;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 4px;
  cursor: pointer;
}

.color-input-wrapper .form-input {
  flex: 1;
}

.checkbox-field {
  margin-bottom: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.875rem;
  color: var(--text-color, #111);
  cursor: pointer;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.error-message {
  margin: 6px 0 0 0;
  font-size: 0.75rem;
  color: #d32f2f;
}

.field-hint {
  margin: 6px 0 0 0;
  font-size: 0.75rem;
  color: var(--text-secondary, #666);
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--border-color, #e0e0e0);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--primary-color, #2196F3);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover, #1976D2);
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
}

.btn i {
  font-size: 1rem;
}
</style>
