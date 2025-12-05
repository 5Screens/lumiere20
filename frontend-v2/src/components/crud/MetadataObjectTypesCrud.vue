<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <div class="flex items-center gap-2">
            <i class="pi pi-database text-xl text-primary-500" />
            <span class="font-semibold text-lg">{{ $t('metadata.objectTypes.title') }}</span>
          </div>
        </template>

        <template #end>
          <Button 
            icon="pi pi-refresh" 
            severity="secondary" 
            @click="loadObjectTypes" 
            :loading="loading"
            v-tooltip.bottom="$t('common.refresh')"
          />
        </template>
      </Toolbar>

      <!-- Info message -->
      <Message severity="info" :closable="false" class="mb-4">
        <template #icon>
          <i class="pi pi-info-circle" />
        </template>
        {{ $t('metadata.objectTypes.infoMessage') }}
      </Message>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:selection="selectedItem"
        :value="objectTypes"
        dataKey="uuid"
        :loading="loading"
        scrollable
        scrollHeight="flex"
        selectionMode="single"
        @rowSelect="onRowSelect"
        :pt="{
          root: { class: 'flex-1 flex flex-col min-h-0' },
          wrapper: { class: 'flex-1 min-h-0' }
        }"
      >
        <!-- Header with search -->
        <template #header>
          <div class="flex justify-between items-center">
            <IconField>
              <InputIcon>
                <i class="pi pi-search" />
              </InputIcon>
              <InputText 
                v-model="searchQuery" 
                :placeholder="$t('common.search')" 
              />
            </IconField>
          </div>
        </template>

        <!-- Icon column -->
        <Column field="icon" :header="$t('metadata.objectTypes.icon')" style="width: 4rem">
          <template #body="{ data }">
            <i v-if="data.icon" :class="data.icon" class="text-lg" />
            <span v-else class="text-surface-400">-</span>
          </template>
        </Column>

        <!-- Code column -->
        <Column field="code" :header="$t('metadata.objectTypes.code')" sortable>
          <template #body="{ data }">
            <Tag severity="secondary">{{ data.code }}</Tag>
          </template>
        </Column>

        <!-- Label column -->
        <Column field="label_key" :header="$t('metadata.objectTypes.label')" sortable>
          <template #body="{ data }">
            {{ $t(data.label_key) }}
          </template>
        </Column>

        <!-- API Endpoint column -->
        <Column field="api_endpoint" :header="$t('metadata.objectTypes.apiEndpoint')" sortable>
          <template #body="{ data }">
            <code class="text-sm bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
              {{ data.api_endpoint }}
            </code>
          </template>
        </Column>

        <!-- Default Sort column -->
        <Column :header="$t('metadata.objectTypes.defaultSort')" style="width: 10rem">
          <template #body="{ data }">
            <div class="flex items-center gap-1">
              <span class="text-sm">{{ data.default_sort_field }}</span>
              <i :class="data.default_sort_order === 1 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'" class="text-xs text-surface-400" />
            </div>
          </template>
        </Column>

        <!-- Fields count column -->
        <Column :header="$t('metadata.objectTypes.fieldsCount')" style="width: 6rem">
          <template #body="{ data }">
            <Tag severity="info">{{ data.fields?.length || 0 }}</Tag>
          </template>
        </Column>

        <!-- Active column -->
        <Column field="is_active" :header="$t('common.isActive')" style="width: 5rem">
          <template #body="{ data }">
            <i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
          </template>
        </Column>

        <!-- Actions column -->
        <Column :header="$t('common.actions')" style="width: 6rem">
          <template #body="{ data }">
            <Button 
              icon="pi pi-eye" 
              severity="secondary" 
              rounded 
              size="small"
              @click="openFieldsTab(data)"
              v-tooltip.top="$t('metadata.objectTypes.viewFields')"
            />
          </template>
        </Column>

        <!-- Empty message -->
        <template #empty>
          <div class="text-center py-8 text-surface-500">
            {{ $t('common.noData') }}
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Toast -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useTabsStore } from '@/stores/tabsStore'
import metadataService from '@/services/metadataService'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import Message from 'primevue/message'

// Props
const props = defineProps({
  tabId: {
    type: String,
    default: null
  }
})

// Composables
const toast = useToast()
const { t } = useI18n()
const tabsStore = useTabsStore()

// Refs
const dt = ref()
const objectTypes = ref([])
const selectedItem = ref(null)
const loading = ref(false)
const searchQuery = ref('')

// Computed - filtered object types
const filteredObjectTypes = computed(() => {
  if (!searchQuery.value) return objectTypes.value
  const query = searchQuery.value.toLowerCase()
  return objectTypes.value.filter(ot => 
    ot.code.toLowerCase().includes(query) ||
    t(ot.label_key).toLowerCase().includes(query) ||
    ot.api_endpoint.toLowerCase().includes(query)
  )
})

// Methods
const loadObjectTypes = async () => {
  try {
    loading.value = true
    // Load all object types with their fields
    const types = await metadataService.getAllObjectTypes()
    
    // Load fields for each type
    const typesWithFields = await Promise.all(
      types.map(async (type) => {
        const fullType = await metadataService.getObjectType(type.code, false)
        return fullType
      })
    )
    
    objectTypes.value = typesWithFields
  } catch (error) {
    console.error('Failed to load object types:', error)
    toast.add({ 
      severity: 'error', 
      summary: t('common.error'), 
      detail: t('metadata.objectTypes.loadError'), 
      life: 3000 
    })
  } finally {
    loading.value = false
  }
}

const onRowSelect = (event) => {
  openFieldsTab(event.data)
}

const openFieldsTab = (objectType) => {
  tabsStore.openTab({
    id: `metadata-fields-${objectType.code}`,
    label: `${t(objectType.label_key)} - ${t('metadata.objectFields.title')}`,
    labelKey: objectType.label_key,
    icon: objectType.icon || 'pi pi-list',
    component: 'MetadataObjectFieldsCrud',
    objectType: objectType.code,
    objectTypeData: objectType,
    parentId: props.tabId || 'metadata-object-types'
  })
}

// Lifecycle
onMounted(() => {
  loadObjectTypes()
})
</script>

<style scoped>
:deep(.p-datatable) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.p-datatable-wrapper) {
  flex: 1;
  min-height: 0;
}

:deep(.p-toolbar) {
  border: none;
  background: transparent;
  padding: 0;
}
</style>
