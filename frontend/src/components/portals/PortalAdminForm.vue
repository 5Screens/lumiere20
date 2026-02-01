<template>
  <div class="p-6 max-w-4xl mx-auto h-full overflow-y-auto">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-16 text-surface-500">
      <ProgressSpinner class="mb-4" />
      <p>{{ t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex flex-col items-center justify-center py-16 text-red-500">
      <i class="pi pi-exclamation-triangle text-4xl mb-4"></i>
      <p>{{ error }}</p>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-6">
      <!-- Section: Basic Information -->
      <Panel :header="t('portals.admin.basicInfo')" toggleable>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="code" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.code') }} <span class="text-red-500">*</span>
            </label>
            <InputText
              id="code"
              v-model="formData.code"
              :placeholder="t('portals.admin.codePlaceholder')"
              :invalid="!!errors.code"
              class="w-full"
            />
            <small class="text-surface-400">{{ t('portals.admin.codeHint') }}</small>
            <small v-if="errors.code" class="text-red-500">{{ errors.code }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="name" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.name') }} <span class="text-red-500">*</span>
            </label>
            <InputText
              id="name"
              v-model="formData.name"
              :placeholder="t('portals.admin.namePlaceholder')"
              :invalid="!!errors.name"
              class="w-full"
            />
            <small v-if="errors.name" class="text-red-500">{{ errors.name }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="title" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.title') }}
            </label>
            <InputText
              id="title"
              v-model="formData.title"
              :placeholder="t('portals.admin.titlePlaceholder')"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="subtitle" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.subtitle') }}
            </label>
            <InputText
              id="subtitle"
              v-model="formData.subtitle"
              :placeholder="t('portals.admin.subtitlePlaceholder')"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label for="welcome_template" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.welcomeTemplate') }}
            </label>
            <InputText
              id="welcome_template"
              v-model="formData.welcome_template"
              :placeholder="t('portals.admin.welcomeTemplatePlaceholder')"
              class="w-full"
            />
            <small class="text-surface-400">{{ t('portals.admin.welcomeTemplateHint') }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="base_url" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.baseUrl') }} <span class="text-red-500">*</span>
            </label>
            <InputText
              id="base_url"
              v-model="formData.base_url"
              :placeholder="t('portals.admin.baseUrlPlaceholder')"
              :invalid="!!errors.base_url"
              class="w-full"
            />
            <small v-if="errors.base_url" class="text-red-500">{{ errors.base_url }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="thumbnail_url" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.thumbnailUrl') }}
            </label>
            <InputText
              id="thumbnail_url"
              v-model="formData.thumbnail_url"
              :placeholder="t('portals.admin.thumbnailUrlPlaceholder')"
              class="w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="logo_url" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.logoUrl') }}
            </label>
            <InputText
              id="logo_url"
              v-model="formData.logo_url"
              :placeholder="t('portals.admin.logoUrlPlaceholder')"
              class="w-full"
            />
          </div>
        </div>
      </Panel>

      <!-- Section: Theme -->
      <Panel :header="t('portals.admin.theme')" toggleable>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="theme_primary_color" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.themePrimaryColor') }}
            </label>
            <div class="flex items-center gap-3">
              <ColorPicker v-model="primaryColorModel" format="hex" />
              <InputText
                id="theme_primary_color"
                v-model="formData.theme_primary_color"
                :placeholder="t('portals.admin.colorPlaceholder')"
                class="flex-1"
              />
            </div>
            <small v-if="errors.theme_primary_color" class="text-red-500">{{ errors.theme_primary_color }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label for="theme_secondary_color" class="font-medium text-surface-700 dark:text-surface-200">
              {{ t('portals.admin.themeSecondaryColor') }}
            </label>
            <div class="flex items-center gap-3">
              <ColorPicker v-model="secondaryColorModel" format="hex" />
              <InputText
                id="theme_secondary_color"
                v-model="formData.theme_secondary_color"
                :placeholder="t('portals.admin.colorPlaceholder')"
                class="flex-1"
              />
            </div>
            <small v-if="errors.theme_secondary_color" class="text-red-500">{{ errors.theme_secondary_color }}</small>
          </div>

          <!-- Preview -->
          <div class="md:col-span-2">
            <label class="font-medium text-surface-700 dark:text-surface-200 mb-2 block">
              {{ t('portals.admin.themePreview') }}
            </label>
            <div 
              class="h-20 rounded-lg flex items-center justify-center text-white font-medium"
              :style="{ background: `linear-gradient(135deg, ${formData.theme_primary_color || '#FF6B00'} 0%, ${formData.theme_secondary_color || '#111111'} 100%)` }"
            >
              {{ formData.title || formData.name || 'Portal Preview' }}
            </div>
          </div>
        </div>
      </Panel>

      <!-- Section: Features -->
      <Panel :header="t('portals.admin.features')" toggleable>
        <div class="flex flex-col gap-4">
          <!-- Chat -->
          <div class="flex items-center gap-3">
            <Checkbox v-model="formData.show_chat" :binary="true" inputId="show_chat" />
            <label for="show_chat" class="font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
              {{ t('portals.admin.showChat') }}
            </label>
          </div>

          <div v-if="formData.show_chat" class="ml-8">
            <div class="flex flex-col gap-2">
              <label for="chat_default_message" class="font-medium text-surface-700 dark:text-surface-200">
                {{ t('portals.admin.chatDefaultMessage') }}
              </label>
              <Textarea
                id="chat_default_message"
                v-model="formData.chat_default_message"
                :placeholder="t('portals.admin.chatDefaultMessagePlaceholder')"
                rows="2"
                class="w-full"
              />
            </div>
          </div>

          <!-- Alerts -->
          <div class="flex items-center gap-3">
            <Checkbox v-model="formData.show_alerts" :binary="true" inputId="show_alerts" />
            <label for="show_alerts" class="font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
              {{ t('portals.admin.showAlerts') }}
            </label>
          </div>

          <div v-if="formData.show_alerts" class="ml-8">
            <AlertsTable
              :alerts="allAlerts"
              v-model="selectedAlerts"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <Checkbox v-model="formData.show_actions" :binary="true" inputId="show_actions" />
            <label for="show_actions" class="font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
              {{ t('portals.admin.showActions') }}
            </label>
          </div>

          <div v-if="formData.show_actions" class="ml-8">
            <ActionsTable
              :actions="allActions"
              v-model="selectedActions"
            />
          </div>

          <!-- Widgets -->
          <div class="flex items-center gap-3">
            <Checkbox v-model="formData.show_widgets" :binary="true" inputId="show_widgets" />
            <label for="show_widgets" class="font-medium text-surface-700 dark:text-surface-200 cursor-pointer">
              {{ t('portals.admin.showWidgets') }}
            </label>
          </div>

          <div v-if="formData.show_widgets" class="ml-8">
            <WidgetsTable
              :widgets="allWidgets"
              v-model="selectedWidgets"
            />
          </div>
        </div>
      </Panel>

      <!-- Form Actions -->
      <div class="flex justify-end gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button
          type="submit"
          :label="saving ? t('common.saving') : t('common.save')"
          :loading="saving"
          :disabled="saving"
          icon="pi pi-save"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabsStore } from '@/stores/tabsStore'
import portalsService from '@/services/portalsService'
import ActionsTable from './ActionsTable.vue'
import AlertsTable from './AlertsTable.vue'
import WidgetsTable from './WidgetsTable.vue'
import Panel from 'primevue/panel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import ColorPicker from 'primevue/colorpicker'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const { t } = useI18n()
const tabsStore = useTabsStore()

const props = defineProps({
  objectId: {
    type: String,
    required: true
  },
  tabId: {
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
  chat_default_message: ''
})

const allActions = ref([])
const allAlerts = ref([])
const allWidgets = ref([])
const selectedActions = ref([])
const selectedAlerts = ref([])
const selectedWidgets = ref([])

// Computed for ColorPicker (strips # for picker, adds # for formData)
const primaryColorModel = computed({
  get: () => formData.value.theme_primary_color?.replace('#', '') || '',
  set: (val) => {
    formData.value.theme_primary_color = val ? `#${val.replace('#', '')}` : ''
  }
})

const secondaryColorModel = computed({
  get: () => formData.value.theme_secondary_color?.replace('#', '') || '',
  set: (val) => {
    formData.value.theme_secondary_color = val ? `#${val.replace('#', '')}` : ''
  }
})

// Load portal data
onMounted(async () => {
  try {
    loading.value = true
    
    // Load all actions, alerts, widgets and current portal data in parallel
    const [actions, alerts, widgets, portalFull] = await Promise.all([
      portalsService.listActions(),
      portalsService.listAlerts(),
      portalsService.listWidgets(),
      portalsService.getFullByUuid(props.objectId)
    ])
    
    // Store ALL actions, alerts, widgets
    allActions.value = actions
    allAlerts.value = alerts
    allWidgets.value = widgets
    
    // Extract UUIDs of linked items
    selectedActions.value = portalFull.quick_actions ? portalFull.quick_actions.map(a => a.uuid) : []
    selectedAlerts.value = portalFull.alerts ? portalFull.alerts.map(a => a.uuid) : []
    selectedWidgets.value = portalFull.widgets ? portalFull.widgets.map(w => w.uuid) : []
    
    // Populate form with portal data
    formData.value = {
      code: portalFull.code || '',
      name: portalFull.name || '',
      base_url: portalFull.base_url || '',
      thumbnail_url: portalFull.thumbnail_url || '',
      title: portalFull.title || '',
      subtitle: portalFull.subtitle || '',
      welcome_template: portalFull.welcome_template || 'Bienvenue {firstName} !',
      logo_url: portalFull.logo_url || '',
      theme_primary_color: portalFull.theme_primary_color || '#FF6B00',
      theme_secondary_color: portalFull.theme_secondary_color || '#111111',
      show_chat: portalFull.show_chat !== undefined ? portalFull.show_chat : true,
      show_alerts: portalFull.show_alerts !== undefined ? portalFull.show_alerts : true,
      show_actions: portalFull.show_actions !== undefined ? portalFull.show_actions : true,
      show_widgets: portalFull.show_widgets !== undefined ? portalFull.show_widgets : true,
      chat_default_message: portalFull.chat_default_message || ''
    }
  } catch (err) {
    console.error('[PORTAL ADMIN FORM] Error loading portal:', err)
    error.value = err.message || t('errors.loadingFailed')
  } finally {
    loading.value = false
  }
})

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
    return
  }

  try {
    saving.value = true

    // Prepare data
    const updateData = {}
    for (const [key, value] of Object.entries(formData.value)) {
      if (value === '') {
        updateData[key] = null
      } else {
        updateData[key] = value
      }
    }

    // Add selected actions, alerts, and widgets
    updateData.selected_actions = selectedActions.value
    updateData.selected_alerts = selectedAlerts.value
    updateData.selected_widgets = selectedWidgets.value

    console.info('[PORTAL ADMIN FORM] Submitting portal update:', {
      uuid: props.objectId,
      data: updateData
    })

    await portalsService.updatePortal(props.objectId, updateData)
    
    console.info('[PORTAL ADMIN FORM] Portal updated successfully')
    
    // Update tab label if name changed
    tabsStore.updateTab(props.tabId, { label: formData.value.name })
  } catch (err) {
    console.error('[PORTAL ADMIN FORM] Error updating portal:', err)
  } finally {
    saving.value = false
  }
}
</script>
