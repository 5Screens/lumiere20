<template>
  <div class="h-full flex flex-col">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
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

      <!-- Tabs for ci_types, simple form for others -->
      <Tabs v-if="objectType === 'ci_types'" value="general" class="flex-1">
        <TabList>
          <Tab value="general">{{ $t('ciTypes.tabs.general') }}</Tab>
          <Tab value="extendedFields">{{ $t('ciTypes.tabs.extendedFields') }}</Tab>
        </TabList>
        <TabPanels>
          <!-- General tab -->
          <TabPanel value="general">
            <div class="p-4">
              <ObjectForm 
                :fields="formFields" 
                :item="item" 
                :fieldOptions="fieldOptions"
                @update:item="item = $event"
              />
            </div>
          </TabPanel>

          <!-- Extended fields tab -->
          <TabPanel value="extendedFields">
            <div class="p-4">
              <CiTypeFieldsEditor 
                :ciTypeUuid="item.uuid"
                :ciTypeCode="item.code"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <!-- Simple form for other object types -->
      <div v-else class="flex-1 overflow-auto">
        <ObjectForm 
          :fields="formFields" 
          :item="item" 
          :fieldOptions="fieldOptions"
          @update:item="item = $event"
        />
      </div>
    </template>

    <!-- Not found -->
    <div v-else class="flex-1 flex items-center justify-center text-surface-500">
      <div class="text-center">
        <i class="pi pi-exclamation-circle text-4xl mb-4" />
        <p>{{ $t('common.notFound') }}</p>
      </div>
    </div>

    <!-- Toast -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService } from '@/services'
import metadataService from '@/services/metadataService'

// PrimeVue components
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Toast from 'primevue/toast'

// Custom components
import ObjectForm from './ObjectForm.vue'
import CiTypeFieldsEditor from './CiTypeFieldsEditor.vue'

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

const toast = useToast()
const { t } = useI18n()

// Service
const service = computed(() => getService(props.objectType))

// State
const loading = ref(true)
const saving = ref(false)
const item = ref(null)
const formFields = ref([])
const fieldOptions = ref({})
const objectTypeMetadata = ref(null)

// Get display name for header
const getDisplayName = () => {
  if (!item.value) return ''
  
  // Try common name fields
  const nameFields = ['name', 'label', 'code', 'first_name', 'title']
  for (const field of nameFields) {
    if (item.value[field]) return item.value[field]
  }
  
  return item.value.uuid?.substring(0, 8) || ''
}

// Load metadata
const loadMetadata = async () => {
  try {
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
  }
}

// Load item
const loadItem = async () => {
  if (!props.objectId || !service.value) {
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    
    // Use getByCode for ci_types, getByUuid for others
    if (props.objectType === 'ci_types' && !isUuid(props.objectId)) {
      item.value = await service.value.getByCode(props.objectId)
    } else {
      // Most services have a get or getByUuid method
      if (service.value.getByUuid) {
        item.value = await service.value.getByUuid(props.objectId)
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
    }
  } catch (error) {
    console.error('Failed to load item:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load item', life: 3000 })
  } finally {
    loading.value = false
  }
}

// Check if string is UUID
const isUuid = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Save item
const saveItem = async () => {
  if (!item.value || !service.value) return
  
  try {
    saving.value = true
    await service.value.update(item.value.uuid, item.value)
    toast.add({ severity: 'success', summary: 'Success', detail: t('common.saved'), life: 3000 })
  } catch (error) {
    console.error('Failed to save item:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save item', life: 3000 })
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  await loadMetadata()
  await loadItem()
})
</script>
