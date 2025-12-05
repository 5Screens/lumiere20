<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Toolbar -->
    <Toolbar class="mb-4">
      <template #start>
        <div class="flex items-center gap-2">
          <i class="pi pi-globe text-2xl text-primary-500" />
          <span class="text-lg font-semibold">{{ $t('languages.title') }}</span>
        </div>
      </template>

      <template #end>
        <Button 
          icon="pi pi-refresh" 
          severity="secondary" 
          @click="loadLanguages" 
          :loading="loading" 
          v-tooltip.bottom="$t('common.refresh')"
        />
      </template>
    </Toolbar>

    <!-- Info message -->
    <Message severity="info" :closable="false" class="mb-4">
      <template #default>
        {{ $t('languages.infoMessage') }}
      </template>
    </Message>

    <!-- Languages DataTable -->
    <DataTable
      :value="languages"
      :loading="loading"
      dataKey="uuid"
      scrollable
      scrollHeight="flex"
      class="flex-1"
      :pt="{
        table: { class: 'min-w-full' }
      }"
    >
      <!-- Flag column -->
      <Column field="flag_code" :header="$t('languages.flag')" style="width: 5rem">
        <template #body="{ data }">
          <span class="text-2xl" :title="data.name">
            {{ getFlagEmoji(data.flag_code) }}
          </span>
        </template>
      </Column>

      <!-- Code column -->
      <Column field="code" :header="$t('languages.code')" style="width: 6rem">
        <template #body="{ data }">
          <Tag severity="secondary">{{ data.code.toUpperCase() }}</Tag>
        </template>
      </Column>

      <!-- Native name column -->
      <Column field="name" :header="$t('languages.nativeName')" style="min-width: 10rem">
        <template #body="{ data }">
          <span class="font-medium">{{ data.name }}</span>
        </template>
      </Column>

      <!-- English name column -->
      <Column field="name_en" :header="$t('languages.englishName')" style="min-width: 10rem">
        <template #body="{ data }">
          <span class="text-surface-600 dark:text-surface-400">{{ data.name_en }}</span>
        </template>
      </Column>

      <!-- Active toggle column -->
      <Column field="is_active" :header="$t('languages.active')" style="width: 8rem">
        <template #body="{ data }">
          <ToggleSwitch 
            v-model="data.is_active" 
            @change="toggleLanguage(data)"
            :disabled="saving === data.uuid"
          />
        </template>
      </Column>

      <!-- Status column -->
      <Column :header="$t('languages.status')" style="width: 10rem">
        <template #body="{ data }">
          <Tag 
            :severity="data.is_active ? 'success' : 'secondary'"
            :value="data.is_active ? $t('languages.enabled') : $t('languages.disabled')"
          >
            <template #default>
              <div class="flex items-center gap-1">
                <i :class="data.is_active ? 'pi pi-check' : 'pi pi-times'" />
                <span>{{ data.is_active ? $t('languages.enabled') : $t('languages.disabled') }}</span>
              </div>
            </template>
          </Tag>
        </template>
      </Column>

      <!-- Empty message -->
      <template #empty>
        <div class="text-center py-8 text-surface-500">
          <i class="pi pi-globe text-4xl mb-4" />
          <p>{{ $t('languages.noLanguages') }}</p>
        </div>
      </template>
    </DataTable>

    <!-- Summary footer -->
    <div class="mt-4 p-3 bg-surface-100 dark:bg-surface-800 rounded-lg flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-sm text-surface-600 dark:text-surface-400">
          <i class="pi pi-check-circle text-green-500 mr-1" />
          {{ $t('languages.activeCount', { count: activeCount }) }}
        </span>
        <span class="text-sm text-surface-600 dark:text-surface-400">
          <i class="pi pi-circle text-surface-400 mr-1" />
          {{ $t('languages.totalCount', { count: languages.length }) }}
        </span>
      </div>
      <Button 
        :label="$t('languages.saveChanges')" 
        icon="pi pi-save" 
        @click="saveAllChanges"
        :loading="savingAll"
        :disabled="!hasChanges"
      />
    </div>

    <!-- Toast -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import Message from 'primevue/message'
import Toast from 'primevue/toast'

const props = defineProps({
  tabId: {
    type: String,
    default: null
  },
  objectType: {
    type: String,
    default: 'languages'
  }
})

const toast = useToast()
const { t } = useI18n()

// State
const languages = ref([])
const originalStates = ref({}) // Track original is_active states
const loading = ref(false)
const saving = ref(null) // UUID of language being saved
const savingAll = ref(false)

// Computed
const activeCount = computed(() => languages.value.filter(l => l.is_active).length)

const hasChanges = computed(() => {
  return languages.value.some(lang => lang.is_active !== originalStates.value[lang.uuid])
})

// Flag emoji helper
const getFlagEmoji = (flagCode) => {
  if (!flagCode) return '🏳️'
  const codePoints = flagCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// Load languages
const loadLanguages = async () => {
  loading.value = true
  try {
    const response = await api.get('/languages')
    languages.value = response.data
    // Store original states
    originalStates.value = {}
    languages.value.forEach(lang => {
      originalStates.value[lang.uuid] = lang.is_active
    })
  } catch (error) {
    console.error('Error loading languages:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('languages.loadError'),
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

// Toggle single language
const toggleLanguage = async (language) => {
  saving.value = language.uuid
  try {
    await api.patch(`/languages/${language.uuid}/toggle`, {
      is_active: language.is_active
    })
    
    // Update original state
    originalStates.value[language.uuid] = language.is_active
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: language.is_active 
        ? t('languages.enabledSuccess', { name: language.name })
        : t('languages.disabledSuccess', { name: language.name }),
      life: 3000
    })
  } catch (error) {
    console.error('Error toggling language:', error)
    // Revert the change
    language.is_active = !language.is_active
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('languages.toggleError'),
      life: 5000
    })
  } finally {
    saving.value = null
  }
}

// Save all changes at once
const saveAllChanges = async () => {
  const updates = languages.value
    .filter(lang => lang.is_active !== originalStates.value[lang.uuid])
    .map(lang => ({ uuid: lang.uuid, is_active: lang.is_active }))
  
  if (updates.length === 0) return
  
  savingAll.value = true
  try {
    await api.post('/languages/bulk-toggle', { updates })
    
    // Update original states
    updates.forEach(update => {
      originalStates.value[update.uuid] = update.is_active
    })
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('languages.bulkSaveSuccess', { count: updates.length }),
      life: 3000
    })
  } catch (error) {
    console.error('Error saving languages:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('languages.bulkSaveError'),
      life: 5000
    })
  } finally {
    savingAll.value = false
  }
}

// Load on mount
onMounted(() => {
  loadLanguages()
})
</script>

<style scoped>
:deep(.p-datatable) {
  border-radius: 0.5rem;
  overflow: hidden;
}

:deep(.p-datatable-header) {
  background: transparent;
  border: none;
}
</style>
