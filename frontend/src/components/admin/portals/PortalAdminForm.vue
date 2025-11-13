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
        
        <TextField
          v-model="formData.code"
          :label="$t('portals.admin.code')"
          :placeholder="$t('portals.admin.codePlaceholder')"
          :error="errors.code"
          :required="true"
          @blur="checkCodeUniqueness"
        >
          <span class="field-hint">{{ $t('portals.admin.codeHint') }}</span>
        </TextField>

        <TextField
          v-model="formData.name"
          :label="$t('portals.admin.name')"
          :placeholder="$t('portals.admin.namePlaceholder')"
          :error="errors.name"
          :required="true"
        />

        <TextField
          v-model="formData.base_url"
          :label="$t('portals.admin.baseUrl')"
          :placeholder="$t('portals.admin.baseUrlPlaceholder')"
          :error="errors.base_url"
          :required="true"
        />

        <TextField
          v-model="formData.thumbnail_url"
          :label="$t('portals.admin.thumbnailUrl')"
          :placeholder="$t('portals.admin.thumbnailUrlPlaceholder')"
          :error="errors.thumbnail_url"
        />

        <sSelectField
          v-model="formData.view_component"
          :label="$t('portals.admin.viewComponent')"
          :required="true"
          mode="creation"
          :endpoint="() => Promise.resolve(viewComponentOptions)"
          display-field="label"
          value-field="value"
        />
      </div>

      <!-- Section: Display Configuration -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.displayConfig') }}</h3>

        <TextField
          v-model="formData.title"
          :label="$t('portals.admin.title')"
          :placeholder="$t('portals.admin.titlePlaceholder')"
          :error="errors.title"
        />

        <TextField
          v-model="formData.subtitle"
          :label="$t('portals.admin.subtitle')"
          :placeholder="$t('portals.admin.subtitlePlaceholder')"
          :error="errors.subtitle"
        />

        <TextField
          v-model="formData.welcome_template"
          :label="$t('portals.admin.welcomeTemplate')"
          :placeholder="$t('portals.admin.welcomeTemplatePlaceholder')"
          :error="errors.welcome_template"
        >
          <span class="field-hint">{{ $t('portals.admin.welcomeTemplateHint') }}</span>
        </TextField>

        <TextField
          v-model="formData.logo_url"
          :label="$t('portals.admin.logoUrl')"
          :placeholder="$t('portals.admin.logoUrlPlaceholder')"
          :error="errors.logo_url"
        />
      </div>

      <!-- Section: Theme -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.theme') }}</h3>

        <ColorPicker
          v-model="formData.theme_primary_color"
          :label="$t('portals.admin.themePrimaryColor')"
          :placeholder="$t('portals.admin.colorPlaceholder')"
          :error="errors.theme_primary_color"
        />

        <ColorPicker
          v-model="formData.theme_secondary_color"
          :label="$t('portals.admin.themeSecondaryColor')"
          :placeholder="$t('portals.admin.colorPlaceholder')"
          :error="errors.theme_secondary_color"
        />
      </div>

      <!-- Section: Features -->
      <div class="form-section">
        <h3 class="section-title">{{ $t('portals.admin.features') }}</h3>

        <Checkbox
          v-model="formData.show_chat"
          :label="$t('portals.admin.features')"
          :item-label="$t('portals.admin.showChat')"
        />

        <Checkbox
          v-model="formData.show_alerts"
          :label="$t('portals.admin.features')"
          :item-label="$t('portals.admin.showAlerts')"
        />

        <!-- Alerts Table -->
        <div v-if="formData.show_alerts" class="subsection">
          <h4 class="subsection-title">Alertes disponibles</h4>
          <div class="items-table">
            <div v-if="allAlerts.length === 0" class="empty-state">
              Aucune alerte disponible pour ce portail
            </div>
            <div v-else class="table-rows">
              <div v-for="alert in allAlerts" :key="alert.uuid" class="table-row">
                <input 
                  type="checkbox" 
                  :value="alert.uuid"
                  v-model="selectedAlerts"
                  class="row-checkbox"
                />
                <div class="row-content">
                  <div class="row-title">{{ alert.message }}</div>
                  <div class="row-meta">
                    <span class="badge" :class="`badge-${alert.alert_type}`">{{ alert.alert_type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Checkbox
          v-model="formData.show_actions"
          :label="$t('portals.admin.features')"
          :item-label="$t('portals.admin.showActions')"
        />

        <!-- Actions Table -->
        <div v-if="formData.show_actions" class="subsection">
          <h4 class="subsection-title">Actions rapides disponibles</h4>
          <div class="items-table">
            <div v-if="allActions.length === 0" class="empty-state">
              Aucune action disponible pour ce portail
            </div>
            <div v-else class="table-rows">
              <div v-for="action in allActions" :key="action.uuid" class="table-row">
                <input 
                  type="checkbox" 
                  :value="action.uuid"
                  v-model="selectedActions"
                  class="row-checkbox"
                />
                <div class="row-content">
                  <div class="row-title">{{ action.display_title || action.action_code }}</div>
                  <div class="row-meta">
                    <span v-if="action.description" class="description">{{ action.description }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Checkbox
          v-model="formData.show_widgets"
          :label="$t('portals.admin.features')"
          :item-label="$t('portals.admin.showWidgets')"
        />

        <!-- Widgets Table -->
        <div v-if="formData.show_widgets" class="subsection">
          <h4 class="subsection-title">Widgets disponibles</h4>
          <div class="items-table">
            <div v-if="allWidgets.length === 0" class="empty-state">
              Aucun widget disponible pour ce portail
            </div>
            <div v-else class="table-rows">
              <div v-for="widget in allWidgets" :key="widget.uuid" class="table-row">
                <input 
                  type="checkbox" 
                  :value="widget.uuid"
                  v-model="selectedWidgets"
                  class="row-checkbox"
                />
                <div class="row-content">
                  <div class="row-title">{{ widget.display_title }}</div>
                  <div class="row-meta">
                    <span class="badge">{{ widget.widget_type }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TextArea
          v-model="formData.chat_default_message"
          :label="$t('portals.admin.chatDefaultMessage')"
          :placeholder="$t('portals.admin.chatDefaultMessagePlaceholder')"
          :error="errors.chat_default_message"
          :rows="3"
        />
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <ButtonStandard
          type="submit"
          :label="saving ? $t('common.saving') : $t('common.save')"
          :loading="saving"
          :disabled="saving"
          icon="fas fa-save"
          variant="primary"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import apiService from '@/services/apiService'
import { useTabsStore } from '@/stores/tabsStore'
import TextField from '@/components/common/TextField.vue'
import TextArea from '@/components/common/TextArea.vue'
import ColorPicker from '@/components/common/ColorPicker.vue'
import Checkbox from '@/components/common/Checkbox.vue'
import sSelectField from '@/components/common/sSelectField.vue'
import ButtonStandard from '@/components/common/ButtonStandard.vue'

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
  show_actions: true,
  show_widgets: true,
  chat_default_message: 'En cours d\'implémentation'
})

const viewComponentOptions = ref([])
const allActions = ref([])
const allAlerts = ref([])
const allWidgets = ref([])
const selectedActions = ref([])
const selectedAlerts = ref([])
const selectedWidgets = ref([])

// Load portal data
onMounted(async () => {
  try {
    loading.value = true
    
    // Load portal models
    const models = await apiService.get('portals/models')
    viewComponentOptions.value = models.map(m => ({
      value: m.name,
      label: m.name
    }))
    
    // Load all actions, alerts, widgets
    const [actions, alerts, widgets, portal] = await Promise.all([
      apiService.get('portals/actions'),
      apiService.get('portals/alerts'),
      apiService.get('portals/widgets'),
      apiService.get(`portals/uuid/${props.portalUuid}`)
    ])
    
    // Filter to get only items for this portal
    allActions.value = actions.filter(a => a.rel_portal_uuid === portal.uuid)
    allAlerts.value = alerts.filter(a => a.rel_portal_uuid === portal.uuid)
    allWidgets.value = widgets.filter(w => w.rel_portal_uuid === portal.uuid)
    
    // TODO: Load selected items from junction tables
    // For now, we'll mark all as selected
    selectedActions.value = allActions.value.map(a => a.uuid)
    selectedAlerts.value = allAlerts.value.map(a => a.uuid)
    selectedWidgets.value = allWidgets.value.map(w => w.uuid)
    
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
      show_actions: portal.show_actions !== undefined ? portal.show_actions : true,
      show_widgets: portal.show_widgets !== undefined ? portal.show_widgets : true,
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
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  overflow-y: auto;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 1.5rem;
  text-align: center;
  color: var(--text-color);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  color: var(--error-color);
}

.error-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid var(--primary-color);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-style: italic;
  margin-top: 0.25rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.subsection {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.subsection-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.75rem 0;
}

.items-table {
  width: 100%;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

.table-rows {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.table-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: var(--hover-bg);
  border-color: var(--primary-color);
}

.row-checkbox {
  margin-top: 0.25rem;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.row-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.row-title {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.95rem;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}

.description {
  color: var(--text-secondary);
}

.badge {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-info {
  background: #2196F3;
}

.badge-warning {
  background: #FF9800;
}

.badge-error {
  background: #F44336;
}
</style>
