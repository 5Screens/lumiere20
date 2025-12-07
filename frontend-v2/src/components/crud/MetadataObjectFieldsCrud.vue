<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <div class="flex items-center gap-2">
            <i :class="objectTypeData?.icon || 'pi pi-list'" class="text-xl text-primary-500" />
            <span class="font-semibold text-lg">
              {{ $t(objectTypeData?.label_key || 'metadata.objectFields.title') }}
            </span>
            <Tag severity="secondary">{{ objectType }}</Tag>
          </div>
        </template>

        <template #end>
          <div class="flex items-center gap-2">
            <Button 
              :label="$t('metadata.objectFields.previewTable')"
              icon="pi pi-table" 
              severity="secondary"
              outlined
              @click="showTablePreview = true"
            />
            <Button 
              :label="$t('metadata.objectFields.previewForm')"
              icon="pi pi-file-edit" 
              severity="secondary"
              outlined
              @click="showFormPreview = true"
            />
            <Button 
              icon="pi pi-refresh" 
              severity="secondary" 
              @click="loadFields" 
              :loading="loading"
              v-tooltip.bottom="$t('common.refresh')"
            />
          </div>
        </template>
      </Toolbar>

      <!-- Tabs for different views -->
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabList class="border-none">
          <Tab value="0">{{ $t('metadata.objectFields.allFields') }}</Tab>
          <Tab value="1">{{ $t('metadata.objectFields.tableFields') }}</Tab>
          <Tab value="2">{{ $t('metadata.objectFields.formFields') }}</Tab>
        </TabList>

        <TabPanels class="flex-1 min-h-0">
          <!-- All Fields Tab -->
          <TabPanel value="0" class="h-full flex flex-col">
          <DataTable
            ref="dt"
            :value="fields"
            dataKey="uuid"
            :loading="loading"
            scrollable
            scrollHeight="flex"
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
                <div class="text-sm text-surface-500">
                  {{ fields.length }} {{ $t('metadata.objectFields.fieldsCount') }}
                </div>
              </div>
            </template>

            <!-- Order column -->
            <Column field="display_order" :header="$t('metadata.objectFields.order')" sortable style="width: 4rem">
              <template #body="{ data }">
                <Tag severity="secondary" class="text-xs">{{ data.display_order }}</Tag>
              </template>
            </Column>

            <!-- Field Name column -->
            <Column field="field_name" :header="$t('metadata.objectFields.fieldName')" sortable>
              <template #body="{ data }">
                <code class="text-sm bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                  {{ data.field_name }}
                </code>
              </template>
            </Column>

            <!-- Label column -->
            <Column field="label_key" :header="$t('metadata.objectFields.label')" sortable>
              <template #body="{ data }">
                <div class="flex flex-col">
                  <span>{{ $t(data.label_key) }}</span>
                  <span class="text-xs text-surface-400">{{ data.label_key }}</span>
                </div>
              </template>
            </Column>

            <!-- Field Type column -->
            <Column field="field_type" :header="$t('metadata.objectFields.fieldType')" sortable style="width: 8rem">
              <template #body="{ data }">
                <Tag :severity="getFieldTypeSeverity(data.field_type)">
                  {{ data.field_type }}
                </Tag>
              </template>
            </Column>

            <!-- Data Type column -->
            <Column field="data_type" :header="$t('metadata.objectFields.dataType')" sortable style="width: 6rem">
              <template #body="{ data }">
                <span class="text-sm text-surface-500">{{ data.data_type }}</span>
              </template>
            </Column>

            <!-- Translatable column -->
            <Column field="is_translatable" :header="$t('metadata.objectFields.translatable')" sortable style="width: 6rem">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <i :class="data.is_translatable ? 'pi pi-globe text-blue-500' : 'pi pi-times text-surface-300'" />
                  <span v-if="data.is_translatable" class="text-xs text-blue-500">i18n</span>
                </div>
              </template>
            </Column>

            <!-- Visibility columns -->
            <Column :header="$t('metadata.objectFields.visibility')" style="width: 10rem">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <i 
                    v-tooltip.top="$t('metadata.objectFields.showInTable')"
                    :class="data.show_in_table ? 'pi pi-table text-green-500' : 'pi pi-table text-surface-300'" 
                  />
                  <i 
                    v-tooltip.top="$t('metadata.objectFields.showInForm')"
                    :class="data.show_in_form ? 'pi pi-file-edit text-green-500' : 'pi pi-file-edit text-surface-300'" 
                  />
                  <i 
                    v-tooltip.top="$t('metadata.objectFields.showInDetail')"
                    :class="data.show_in_detail ? 'pi pi-eye text-green-500' : 'pi pi-eye text-surface-300'" 
                  />
                </div>
              </template>
            </Column>

            <!-- Options columns -->
            <Column :header="$t('metadata.objectFields.options')" style="width: 12rem">
              <template #body="{ data }">
                <div class="flex items-center gap-1 flex-wrap">
                  <Tag v-if="data.is_sortable" severity="info" class="text-xs">
                    <i class="pi pi-sort-alt mr-1" />sort
                  </Tag>
                  <Tag v-if="data.is_filterable" severity="info" class="text-xs">
                    <i class="pi pi-filter mr-1" />filter
                  </Tag>
                  <Tag v-if="data.is_editable" severity="success" class="text-xs">
                    <i class="pi pi-pencil mr-1" />edit
                  </Tag>
                  <Tag v-if="data.is_required" severity="danger" class="text-xs">
                    <i class="pi pi-exclamation-circle mr-1" />req
                  </Tag>
                  <Tag v-if="data.is_readonly" severity="warn" class="text-xs">
                    <i class="pi pi-lock mr-1" />ro
                  </Tag>
                  <Tag v-if="data.is_translatable" severity="secondary" class="text-xs">
                    <i class="pi pi-globe mr-1" />i18n
                  </Tag>
                </div>
              </template>
            </Column>

            <!-- Min Width column -->
            <Column field="min_width" :header="$t('metadata.objectFields.minWidth')" style="width: 6rem">
              <template #body="{ data }">
                <span v-if="data.min_width" class="text-sm text-surface-500">{{ data.min_width }}</span>
                <span v-else class="text-surface-300">-</span>
              </template>
            </Column>

            <!-- Empty message -->
            <template #empty>
              <div class="text-center py-8 text-surface-500">
                {{ $t('common.noData') }}
              </div>
            </template>
          </DataTable>
          </TabPanel>

          <!-- Table Fields Tab -->
          <TabPanel value="1" class="h-full flex flex-col">
          <DataTable
            :value="tableFields"
            dataKey="uuid"
            :loading="loading"
            scrollable
            scrollHeight="flex"
          >
            <Column field="display_order" :header="$t('metadata.objectFields.order')" sortable style="width: 4rem">
              <template #body="{ data }">
                <Tag severity="secondary" class="text-xs">{{ data.display_order }}</Tag>
              </template>
            </Column>
            <Column field="field_name" :header="$t('metadata.objectFields.fieldName')" sortable />
            <Column field="label_key" :header="$t('metadata.objectFields.label')">
              <template #body="{ data }">
                {{ $t(data.label_key) }}
              </template>
            </Column>
            <Column field="field_type" :header="$t('metadata.objectFields.fieldType')">
              <template #body="{ data }">
                <Tag :severity="getFieldTypeSeverity(data.field_type)">{{ data.field_type }}</Tag>
              </template>
            </Column>
            <Column field="is_sortable" :header="$t('metadata.objectFields.sortable')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_sortable ? 'pi pi-check text-green-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="is_filterable" :header="$t('metadata.objectFields.filterable')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_filterable ? 'pi pi-check text-green-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="default_visible" :header="$t('metadata.objectFields.defaultVisible')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.default_visible ? 'pi pi-check text-green-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="is_translatable" :header="$t('metadata.objectFields.translatable')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_translatable ? 'pi pi-globe text-blue-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
          </DataTable>
          </TabPanel>

          <!-- Form Fields Tab -->
          <TabPanel value="2" class="h-full flex flex-col">
          <DataTable
            :value="formFields"
            dataKey="uuid"
            :loading="loading"
            scrollable
            scrollHeight="flex"
          >
            <Column field="display_order" :header="$t('metadata.objectFields.order')" sortable style="width: 4rem">
              <template #body="{ data }">
                <Tag severity="secondary" class="text-xs">{{ data.display_order }}</Tag>
              </template>
            </Column>
            <Column field="field_name" :header="$t('metadata.objectFields.fieldName')" sortable />
            <Column field="label_key" :header="$t('metadata.objectFields.label')">
              <template #body="{ data }">
                {{ $t(data.label_key) }}
              </template>
            </Column>
            <Column field="field_type" :header="$t('metadata.objectFields.fieldType')">
              <template #body="{ data }">
                <Tag :severity="getFieldTypeSeverity(data.field_type)">{{ data.field_type }}</Tag>
              </template>
            </Column>
            <Column field="is_required" :header="$t('metadata.objectFields.required')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_required ? 'pi pi-check text-red-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="is_readonly" :header="$t('metadata.objectFields.readonly')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_readonly ? 'pi pi-check text-orange-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="is_editable" :header="$t('metadata.objectFields.editable')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_editable ? 'pi pi-check text-green-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
            <Column field="is_translatable" :header="$t('metadata.objectFields.translatable')" style="width: 5rem">
              <template #body="{ data }">
                <i :class="data.is_translatable ? 'pi pi-globe text-blue-500' : 'pi pi-times text-surface-300'" />
              </template>
            </Column>
          </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>

    <!-- Table Preview Dialog -->
    <Dialog 
      v-model:visible="showTablePreview" 
      :header="$t('metadata.objectFields.tablePreviewTitle')"
      :style="{ width: '90vw', maxWidth: '1200px' }"
      modal
    >
      <div class="mb-4">
        <Message severity="info" :closable="false">
          {{ $t('metadata.objectFields.tablePreviewInfo') }}
        </Message>
      </div>
      
      <DataTable
        :value="sampleData"
        scrollable
        scrollHeight="400px"
      >
        <Column 
          v-for="col in tableFields" 
          :key="col.field_name"
          :field="col.field_name"
          :header="$t(col.label_key)"
          :sortable="col.is_sortable"
          :style="col.min_width ? `min-width: ${col.min_width}` : undefined"
        >
          <template #body="{ data }">
            <!-- Boolean -->
            <template v-if="col.field_type === 'boolean'">
              <i :class="data[col.field_name] ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
            <!-- Select -->
            <template v-else-if="col.field_type === 'select'">
              <Tag severity="info">{{ data[col.field_name] }}</Tag>
            </template>
            <!-- Date -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              {{ formatDate(data[col.field_name]) }}
            </template>
            <!-- Default -->
            <template v-else>
              {{ data[col.field_name] ?? '-' }}
            </template>
          </template>
        </Column>
      </DataTable>
    </Dialog>

    <!-- Form Preview Dialog -->
    <Dialog 
      v-model:visible="showFormPreview" 
      :header="$t('metadata.objectFields.formPreviewTitle')"
      :style="{ width: '600px' }"
      modal
    >
      <div class="mb-4">
        <Message severity="info" :closable="false">
          {{ $t('metadata.objectFields.formPreviewInfo') }}
        </Message>
      </div>
      
      <div class="flex flex-col gap-4">
        <div 
          v-for="field in formFields" 
          :key="field.field_name" 
          class="flex flex-col gap-2"
        >
          <label class="font-semibold">
            {{ $t(field.label_key) }}
            <span v-if="field.is_required" class="text-red-500">*</span>
            <span v-if="field.is_readonly" class="text-orange-500 text-xs ml-1">(readonly)</span>
          </label>
          
          <!-- Text input -->
          <InputText 
            v-if="field.field_type === 'text'"
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            fluid 
          />
          
          <!-- Textarea -->
          <Textarea 
            v-else-if="field.field_type === 'textarea'"
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            rows="3" 
            fluid 
          />
          
          <!-- Number input -->
          <InputNumber 
            v-else-if="field.field_type === 'number'"
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            :min="field.min_value"
            :max="field.max_value"
            fluid 
          />
          
          <!-- Select -->
          <Select 
            v-else-if="field.field_type === 'select'"
            :options="[{ label: 'Option 1', value: '1' }, { label: 'Option 2', value: '2' }]"
            optionLabel="label"
            optionValue="value"
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            fluid
          />
          
          <!-- Boolean toggle -->
          <ToggleSwitch 
            v-else-if="field.field_type === 'boolean'"
            :disabled="field.is_readonly"
          />
          
          <!-- Date picker -->
          <DatePicker 
            v-else-if="field.field_type === 'date' || field.field_type === 'datetime'"
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            :showTime="field.field_type === 'datetime'"
            dateFormat="dd/mm/yy"
            fluid 
          />
          
          <!-- Default text -->
          <InputText 
            v-else
            :placeholder="$t(field.label_key)"
            :disabled="field.is_readonly"
            fluid 
          />
        </div>
      </div>
    </Dialog>

    <!-- Toast -->
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import metadataService from '@/services/metadataService'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import Message from 'primevue/message'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import DatePicker from 'primevue/datepicker'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  objectTypeData: {
    type: Object,
    default: null
  },
  tabId: {
    type: String,
    default: null
  }
})

// Composables
const toast = useToast()
const { t } = useI18n()

// Refs
const dt = ref()
const fields = ref([])
const loading = ref(false)
const searchQuery = ref('')
const activeTab = ref('0')
const showTablePreview = ref(false)
const showFormPreview = ref(false)

// Computed
const tableFields = computed(() => {
  return fields.value.filter(f => f.show_in_table)
})

const formFields = computed(() => {
  return fields.value.filter(f => f.show_in_form)
})

// Sample data for preview
const sampleData = computed(() => {
  const sample = {}
  for (const field of tableFields.value) {
    switch (field.field_type) {
      case 'boolean':
        sample[field.field_name] = Math.random() > 0.5
        break
      case 'number':
        sample[field.field_name] = Math.floor(Math.random() * 100)
        break
      case 'datetime':
      case 'date':
        sample[field.field_name] = new Date().toISOString()
        break
      case 'select':
        sample[field.field_name] = 'Option 1'
        break
      default:
        sample[field.field_name] = `Sample ${field.field_name}`
    }
  }
  return [sample, { ...sample, uuid: '2' }, { ...sample, uuid: '3' }]
})

// Methods
const loadFields = async () => {
  try {
    loading.value = true
    
    // If we have objectTypeData with fields, use it
    if (props.objectTypeData?.fields) {
      fields.value = props.objectTypeData.fields
    } else {
      // Otherwise load from API
      const objectType = await metadataService.getObjectType(props.objectType, false)
      fields.value = objectType?.fields || []
    }
  } catch (error) {
    console.error('Failed to load fields:', error)
    toast.add({ 
      severity: 'error', 
      summary: t('common.error'), 
      detail: t('metadata.objectFields.loadError'), 
      life: 3000 
    })
  } finally {
    loading.value = false
  }
}

const getFieldTypeSeverity = (fieldType) => {
  const severities = {
    text: 'info',
    textarea: 'info',
    number: 'success',
    boolean: 'warn',
    date: 'secondary',
    datetime: 'secondary',
    select: 'primary',
    relation: 'danger',
    tag_style: 'contrast',
    icon_picker: 'contrast'
  }
  return severities[fieldType] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Lifecycle
onMounted(() => {
  loadFields()
})
</script>

