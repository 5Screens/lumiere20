<template>
  <div class="h-full flex flex-col">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 px-4 pt-4">
        <h2 class="text-xl font-semibold">
          {{ getDisplayName() }}
        </h2>
        <div class="flex gap-2">
          <Button 
            :label="$t('common.save')" 
            icon="pi pi-check" 
            @click="saveItem"
            :loading="saving"
          />
        </div>
      </div>

      <!-- UUID Display (only in edit mode) -->
      <UuidDisplay v-if="mode === 'edit'" :uuid="item?.uuid" />

      <!-- Tabs -->
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabList class="shrink-0 px-4">
          <Tab value="general" :pt="{ root: { class: 'pl-0' } }">
            <i class="pi pi-file-edit mr-2" />
            {{ $t('common.generalInfo') }}
          </Tab>
          <Tab v-if="hasExtendedInfo" value="extended">
            <i class="pi pi-list mr-2" />
            {{ $t('common.extendedInfo') }}
          </Tab>
          <!-- Future tabs can be added here -->
        </TabList>
        
        <TabPanels class="flex-1 min-h-0 overflow-hidden" :pt="{ root: { class: 'p-0' } }">
          <!-- General Info Tab -->
          <TabPanel value="general" class="h-full overflow-auto">
            <ObjectGeneralInfo 
              v-model="item"
              :formFields="formFields"
              :fieldOptions="fieldOptions"
              :loading="metadataLoading"
            />
          </TabPanel>

          <!-- Extended Info Tab -->
          <TabPanel v-if="hasExtendedInfo" value="extended" class="h-full overflow-auto">
            <ObjectExtendedInfo 
              v-model="item"
              :objectType="objectType"
              :extendedFields="extendedFields"
              :loading="extendedFieldsLoading"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <!-- Not found -->
    <div v-else class="flex-1 flex items-center justify-center text-surface-500">
      <div class="text-center">
        <i class="pi pi-exclamation-circle text-4xl mb-4" />
        <p>{{ $t('common.notFound') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService } from '@/services'
import metadataService from '@/services/metadataService'
import ciTypeFieldsService from '@/services/ciTypeFieldsService'
import ciTypesService from '@/services/ciTypesService'

// PrimeVue components
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'

// Custom components
import ObjectGeneralInfo from './ObjectGeneralInfo.vue'
import ObjectExtendedInfo from './ObjectExtendedInfo.vue'
import UuidDisplay from '@/components/form/UuidDisplay.vue'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  objectId: {
    type: String,
    default: null
  },
  tabId: {
    type: String,
    default: null
  },
  mode: {
    type: String,
    default: 'edit' // 'edit' or 'create'
  }
})

// Emits
const emit = defineEmits(['saved', 'close'])

// Composables
const toast = useToast()
const { t, locale } = useI18n()

// Service
const service = computed(() => getService(props.objectType))

// State
const loading = ref(true)
const saving = ref(false)
const item = ref(null)
const activeTab = ref('general')

// Metadata
const metadataLoading = ref(true)
const formFields = ref([])
const fieldOptions = ref({})
const objectTypeMetadata = ref(null)

// Extended fields (for configuration_items)
const extendedFields = ref([])
const extendedFieldsLoading = ref(false)
const ciTypes = ref([])

// Computed
const hasExtendedInfo = computed(() => {
  // Show extended tab for ci_types and configuration_items
  return ['ci_types', 'configuration_items'].includes(props.objectType)
})

// Methods

// Get display name for header
const getDisplayName = () => {
  if (!item.value) return ''
  
  // Try common name fields
  const nameFields = ['name', 'label', 'code', 'first_name', 'title']
  for (const field of nameFields) {
    if (item.value[field]) return item.value[field]
  }
  
  return item.value.uuid?.substring(0, 8) || t('common.new')
}

// Load metadata
const loadMetadata = async () => {
  try {
    metadataLoading.value = true
    objectTypeMetadata.value = await metadataService.getObjectType(props.objectType)
    
    if (objectTypeMetadata.value) {
      formFields.value = objectTypeMetadata.value.fields.filter(f => f.show_in_form)
      
      // Load options for select fields
      const selectFields = formFields.value.filter(f => f.field_type === 'select' && f.options_source)
      await Promise.all(selectFields.map(async (field) => {
        let options = []
        if (metadataService.isApiEndpoint(field.options_source)) {
          options = await metadataService.fetchOptions(field.options_source)
        } else {
          options = metadataService.parseOptions(field.options_source)
        }
        fieldOptions.value[field.field_name] = options.map(opt => {
          if (opt.label_key) {
            return { ...opt, label: t(opt.label_key) }
          }
          return opt
        })
      }))
    }
  } catch (error) {
    console.error('Failed to load metadata:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load metadata', life: 3000 })
  } finally {
    metadataLoading.value = false
  }
}

// Load item
const loadItem = async () => {
  if (props.mode === 'create') {
    // Initialize new item with defaults
    item.value = initializeNewItem()
    loading.value = false
    return
  }
  
  if (!props.objectId || !service.value) {
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    
    // Load item by UUID
    if (service.value.getByUuid) {
      item.value = await service.value.getByUuid(props.objectId)
      console.log('[ObjectViewInTab] loadItem - item loaded:', JSON.stringify(item.value, null, 2))
      console.log('[ObjectViewInTab] loadItem - _translations:', JSON.stringify(item.value?._translations, null, 2))
    } else if (service.value.get) {
      item.value = await service.value.get(props.objectId)
    } else {
      // Fallback: search by uuid
      const result = await service.value.search({ 
        filters: { uuid: { value: props.objectId, matchMode: 'equals' } },
        page: 1,
        limit: 1
      })
      item.value = result.data?.[0] || null
    }
    
    // Load extended fields if configuration_items
    if (props.objectType === 'configuration_items' && item.value?.ci_type) {
      await loadExtendedFields(item.value.ci_type)
      // Update form fields based on has_model
      updateFormFieldsForCiType(item.value.ci_type)
    }
  } catch (error) {
    console.error('Failed to load item:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load item', life: 3000 })
  } finally {
    loading.value = false
  }
}

// Initialize new item with default values
const initializeNewItem = () => {
  const defaults = {}
  for (const field of formFields.value) {
    if (field.field_type === 'boolean') {
      defaults[field.field_name] = false
    } else {
      defaults[field.field_name] = null
    }
  }
  
  // Initialize extended_core_fields for configuration_items
  if (props.objectType === 'configuration_items') {
    defaults.extended_core_fields = {}
  }
  
  return defaults
}

// Update form fields visibility based on CI type's has_model property
const updateFormFieldsForCiType = (ciTypeCode) => {
  if (props.objectType !== 'configuration_items') return
  
  const ciType = ciTypes.value.find(ct => ct.code === ciTypeCode)
  const hasModel = ciType?.has_model === true
  
  // Filter rel_model_uuid field based on has_model
  if (objectTypeMetadata.value?.fields) {
    formFields.value = objectTypeMetadata.value.fields
      .filter(f => f.show_in_form)
      .filter(f => {
        // Hide rel_model_uuid if CI type doesn't have has_model
        if (f.field_name === 'rel_model_uuid') {
          return hasModel
        }
        return true
      })
  }
}

// Load extended fields for configuration_items
const loadExtendedFields = async (ciTypeCode) => {
  if (!ciTypeCode || props.objectType !== 'configuration_items') {
    extendedFields.value = []
    return
  }
  
  try {
    extendedFieldsLoading.value = true
    
    // First get CI type UUID from code
    if (ciTypes.value.length === 0) {
      const types = await ciTypesService.getAll()
      ciTypes.value = types
    }
    
    const ciType = ciTypes.value.find(ct => ct.code === ciTypeCode)
    if (!ciType) {
      extendedFields.value = []
      return
    }
    
    // Load fields for this CI type
    const fields = await ciTypeFieldsService.getByTypeUuid(ciType.uuid)
    extendedFields.value = fields.filter(f => f.show_in_form).map(f => ({
      ...f,
      label: f._translations?.label?.[locale.value] || f.label
    }))
  } catch (error) {
    console.error('Failed to load extended fields:', error)
    extendedFields.value = []
  } finally {
    extendedFieldsLoading.value = false
  }
}

// Save item
const saveItem = async () => {
  if (!item.value || !service.value) return
  
  // Validate required fields
  const requiredFields = formFields.value.filter(f => f.is_required)
  for (const field of requiredFields) {
    const value = item.value[field.field_name]
    if (value === null || value === undefined || value === '') {
      toast.add({ severity: 'warn', summary: 'Warning', detail: `${t(field.label_key)} is required`, life: 3000 })
      return
    }
  }
  
  try {
    saving.value = true
    
    if (props.mode === 'create') {
      const created = await service.value.create(item.value)
      item.value = created
      toast.add({ severity: 'success', summary: 'Success', detail: t('common.created'), life: 3000 })
    } else {
      await service.value.update(item.value.uuid, item.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t('common.saved'), life: 3000 })
    }
    
    emit('saved', item.value)
  } catch (error) {
    console.error('Failed to save item:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save item', life: 3000 })
  } finally {
    saving.value = false
  }
}

// Watch for ci_type changes to reload extended fields
watch(() => item.value?.ci_type, async (newCiType, oldCiType) => {
  if (newCiType && newCiType !== oldCiType && props.objectType === 'configuration_items') {
    await loadExtendedFields(newCiType)
    // Update form fields based on has_model
    updateFormFieldsForCiType(newCiType)
  }
})

// Lifecycle
onMounted(async () => {
  await loadMetadata()
  await loadItem()
})
</script>
