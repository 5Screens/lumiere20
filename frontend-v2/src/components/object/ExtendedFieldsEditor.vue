<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Toolbar -->
    <div class="flex justify-between items-center shrink-0">
      <span class="text-sm text-surface-500">
        {{ fields.length }} {{ $t('extendedFields.fieldsCount') }}
      </span>
      <Button 
        :label="$t('extendedFields.addField')" 
        icon="pi pi-plus" 
        size="small"
        @click="openAddDialog"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Empty state -->
    <div v-else-if="fields.length === 0" class="text-center p-8 text-surface-500 bg-surface-50 rounded-lg">
      <i class="pi pi-inbox text-4xl mb-2" />
      <p>{{ $t('extendedFields.noFields') }}</p>
      <p class="text-sm mt-2">{{ $t('extendedFields.noFieldsHint') }}</p>
    </div>

    <!-- Fields table -->
    <DataTable 
      v-else
      :value="fields" 
      dataKey="uuid"
      size="small"
      :reorderableRows="true"
      @rowReorder="onRowReorder"
      scrollable
      scrollHeight="flex"
      class="text-sm flex-1"
    >
      <!-- Drag handle -->
      <Column :rowReorder="true" style="width: 2.5rem" />

      <!-- Field name -->
      <Column field="field_name" :header="$t('extendedFields.fieldName')" style="min-width: 130px">
        <template #body="{ data }">
          <code class="text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded">{{ data.field_name }}</code>
        </template>
      </Column>

      <!-- Label -->
      <Column field="label" :header="$t('extendedFields.label')" style="min-width: 160px">
        <template #body="{ data }">
          <span class="text-sm">{{ data.label }}</span>
        </template>
      </Column>

      <!-- Field type -->
      <Column field="field_type" :header="$t('extendedFields.type')" style="width: 100px">
        <template #body="{ data }">
          <Tag :value="data.field_type" :severity="getFieldTypeSeverity(data.field_type)" size="small" />
        </template>
      </Column>

      <!-- Show in form -->
      <Column :header="$t('extendedFields.form')" style="width: 70px">
        <template #body="{ data }">
          <ToggleSwitch 
            :modelValue="data.show_in_form" 
            @update:modelValue="toggleVisibility(data, 'show_in_form')"
            size="small"
          />
        </template>
      </Column>

      <!-- Show in table -->
      <Column :header="$t('extendedFields.table')" style="width: 70px">
        <template #body="{ data }">
          <ToggleSwitch 
            :modelValue="data.show_in_table" 
            @update:modelValue="toggleVisibility(data, 'show_in_table')"
            size="small"
          />
        </template>
      </Column>

      <!-- Required -->
      <Column :header="$t('extendedFields.req')" style="width: 50px">
        <template #body="{ data }">
          <i v-if="data.is_required" class="pi pi-check text-green-500 text-xs" />
          <i v-else class="pi pi-minus text-surface-300 text-xs" />
        </template>
      </Column>

      <!-- Actions -->
      <Column style="width: 80px">
        <template #body="{ data }">
          <div class="flex gap-1">
            <Button 
              icon="pi pi-pencil" 
              severity="secondary" 
              text 
              rounded 
              size="small"
              @click="openEditDialog(data)"
              v-tooltip.top="$t('common.edit')"
            />
            <Button 
              icon="pi pi-trash" 
              severity="danger" 
              text 
              rounded 
              size="small"
              @click="confirmDelete(data)"
              v-tooltip.top="$t('common.delete')"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Add/Edit Field Dialog -->
    <Dialog 
      v-model:visible="fieldDialog" 
      :header="fieldDialogMode === 'create' ? $t('extendedFields.addField') : $t('extendedFields.editField')"
      :style="{ width: '650px' }"
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <!-- Row 1: Field name & Label key -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="field_name" class="font-semibold text-sm">
              {{ $t('extendedFields.fieldName') }} <span class="text-red-500">*</span>
            </label>
            <InputText 
              id="field_name" 
              v-model="editField.field_name" 
              :disabled="fieldDialogMode === 'edit'"
              placeholder="serial_number"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="font-semibold text-sm">
              {{ $t('extendedFields.label') }} <span class="text-red-500">*</span>
            </label>
            <TranslatableInput
              v-model="editField.label"
              :translations="editField._translations?.label || {}"
              :fieldLabel="$t('extendedFields.label')"
              :placeholder="$t('extendedFields.labelPlaceholder')"
              @update:translations="updateLabelTranslations"
            />
          </div>
        </div>

        <!-- Row 2: Field type & Data type -->
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-2">
            <label for="field_type" class="font-semibold text-sm">
              {{ $t('extendedFields.fieldType') }} <span class="text-red-500">*</span>
            </label>
            <Select 
              id="field_type" 
              v-model="editField.field_type" 
              :options="fieldTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              size="small"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label for="data_type" class="font-semibold text-sm">
              {{ $t('extendedFields.dataType') }}
            </label>
            <Select 
              id="data_type" 
              v-model="editField.data_type" 
              :options="dataTypeOptions" 
              optionLabel="label" 
              optionValue="value"
              size="small"
            />
          </div>
        </div>

        <!-- Row 3: Display options -->
        <div class="flex flex-wrap gap-6">
          <div class="flex items-center gap-2">
            <Checkbox v-model="editField.show_in_form" inputId="show_in_form" :binary="true" />
            <label for="show_in_form" class="text-sm">{{ $t('extendedFields.showInForm') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="editField.show_in_table" inputId="show_in_table" :binary="true" />
            <label for="show_in_table" class="text-sm">{{ $t('extendedFields.showInTable') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="editField.is_required" inputId="is_required" :binary="true" />
            <label for="is_required" class="text-sm">{{ $t('extendedFields.required') }}</label>
          </div>
          <div class="flex items-center gap-2">
            <Checkbox v-model="editField.is_readonly" inputId="is_readonly" :binary="true" />
            <label for="is_readonly" class="text-sm">{{ $t('extendedFields.readonly') }}</label>
          </div>
        </div>

        <!-- Row 4: Validation (for number/text) -->
        <div v-if="['number', 'text'].includes(editField.field_type)" class="grid grid-cols-3 gap-4">
          <div v-if="editField.field_type === 'number'" class="flex flex-col gap-2">
            <label for="min_value" class="font-semibold text-sm">{{ $t('extendedFields.minValue') }}</label>
            <InputNumber id="min_value" v-model="editField.min_value" size="small" />
          </div>
          <div v-if="editField.field_type === 'number'" class="flex flex-col gap-2">
            <label for="max_value" class="font-semibold text-sm">{{ $t('extendedFields.maxValue') }}</label>
            <InputNumber id="max_value" v-model="editField.max_value" size="small" />
          </div>
          <div v-if="editField.field_type === 'text'" class="flex flex-col gap-2">
            <label for="max_length" class="font-semibold text-sm">{{ $t('extendedFields.maxLength') }}</label>
            <InputNumber id="max_length" v-model="editField.max_length" size="small" />
          </div>
          <div v-if="editField.field_type === 'number'" class="flex flex-col gap-2">
            <label for="unit" class="font-semibold text-sm">{{ $t('extendedFields.unit') }}</label>
            <InputText id="unit" v-model="editField.unit" placeholder="GB, VA, %" size="small" />
          </div>
        </div>

        <!-- Row 5: Options for select -->
        <div v-if="editField.field_type === 'select'" class="flex flex-col gap-2">
          <label for="options_source" class="font-semibold text-sm">
            {{ $t('extendedFields.options') }}
          </label>
          <Textarea 
            id="options_source" 
            v-model="editField.options_source" 
            rows="4"
            placeholder='[{"label": "Option 1", "value": "OPT1"}, {"label": "Option 2", "value": "OPT2"}]'
          />
          <small class="text-surface-500">{{ $t('extendedFields.optionsHelp') }}</small>
        </div>

        <!-- Row 6: Default value -->
        <div class="flex flex-col gap-2">
          <label for="default_value" class="font-semibold text-sm">{{ $t('extendedFields.defaultValue') }}</label>
          <InputText id="default_value" v-model="editField.default_value" size="small" />
        </div>
      </div>

      <template #footer>
        <Button :label="$t('common.cancel')" severity="secondary" text @click="fieldDialog = false" />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="saveField" :loading="savingField" />
      </template>
    </Dialog>

    <!-- Delete confirmation -->
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'
import ciTypeFieldsService from '@/services/ciTypeFieldsService'
import ticketTypeFieldsService from '@/services/ticketTypeFieldsService'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import TranslatableInput from '@/components/form/TranslatableInput.vue'

const props = defineProps({
  // Entity type: 'ci_types' or 'ticket_types'
  entityType: {
    type: String,
    required: true,
    validator: (value) => ['ci_types', 'ticket_types'].includes(value)
  },
  // UUID of the parent entity (ci_type or ticket_type)
  parentUuid: {
    type: String,
    required: true
  },
  // Code of the parent entity (optional, for display)
  parentCode: {
    type: String,
    default: ''
  }
})

const toast = useToast()
const confirm = useConfirm()
const { t } = useI18n()

// Computed service based on entity type
const service = computed(() => {
  return props.entityType === 'ci_types' ? ciTypeFieldsService : ticketTypeFieldsService
})

// Computed FK field name based on entity type
const parentUuidFieldName = computed(() => {
  return props.entityType === 'ci_types' ? 'ci_type_uuid' : 'ticket_type_uuid'
})

// State
const loading = ref(true)
const fields = ref([])
const fieldDialog = ref(false)
const fieldDialogMode = ref('create')
const editField = ref({})
const savingField = ref(false)

// Options
const fieldTypeOptions = [
  { label: 'Text', value: 'text' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Datetime', value: 'datetime' },
  { label: 'Select', value: 'select' },
  { label: 'Multiselect', value: 'multiselect' }
]

const dataTypeOptions = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Date', value: 'date' },
  { label: 'Array', value: 'array' }
]

// Load fields
const loadFields = async () => {
  try {
    loading.value = true
    fields.value = await service.value.getByTypeUuid(props.parentUuid)
  } catch (error) {
    console.error('Failed to load fields:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load fields', life: 3000 })
  } finally {
    loading.value = false
  }
}

// Get field type severity for Tag
const getFieldTypeSeverity = (type) => {
  const severities = {
    text: 'info',
    textarea: 'info',
    number: 'success',
    boolean: 'warn',
    date: 'secondary',
    datetime: 'secondary',
    select: 'primary',
    multiselect: 'primary'
  }
  return severities[type] || 'secondary'
}

// Open add dialog
const openAddDialog = () => {
  editField.value = {
    [parentUuidFieldName.value]: props.parentUuid,
    field_name: '',
    label: '',
    field_type: 'text',
    data_type: 'string',
    show_in_form: true,
    show_in_table: false,
    is_required: false,
    is_readonly: false,
    display_order: fields.value.length,
    min_value: null,
    max_value: null,
    max_length: null,
    default_value: null,
    options_source: null,
    unit: null,
    _translations: { label: {} }
  }
  fieldDialogMode.value = 'create'
  fieldDialog.value = true
}

// Open edit dialog
const openEditDialog = (field) => {
  editField.value = { ...field }
  fieldDialogMode.value = 'edit'
  fieldDialog.value = true
}

// Update label translations from TranslatableInput
const updateLabelTranslations = (translations) => {
  if (!editField.value._translations) {
    editField.value._translations = {}
  }
  editField.value._translations.label = translations
}

// Save field
const saveField = async () => {
  // Validation
  if (!editField.value.field_name || !editField.value.label) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: t('extendedFields.requiredFields'), life: 3000 })
    return
  }

  try {
    savingField.value = true
    
    if (fieldDialogMode.value === 'create') {
      await service.value.create(editField.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t('extendedFields.fieldCreated'), life: 3000 })
    } else {
      await service.value.update(editField.value.uuid, editField.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t('extendedFields.fieldUpdated'), life: 3000 })
    }
    
    fieldDialog.value = false
    await loadFields()
  } catch (error) {
    console.error('Failed to save field:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save field', life: 3000 })
  } finally {
    savingField.value = false
  }
}

// Toggle visibility
const toggleVisibility = async (field, property) => {
  try {
    await service.value.toggleVisibility(field.uuid, property)
    field[property] = !field[property]
  } catch (error) {
    console.error('Failed to toggle visibility:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update field', life: 3000 })
  }
}

// Confirm delete
const confirmDelete = (field) => {
  confirm.require({
    message: t('extendedFields.confirmDelete', { name: field.field_name }),
    header: t('common.delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => deleteField(field)
  })
}

// Delete field
const deleteField = async (field) => {
  try {
    await service.value.delete(field.uuid)
    toast.add({ severity: 'success', summary: 'Success', detail: t('extendedFields.fieldDeleted'), life: 3000 })
    await loadFields()
  } catch (error) {
    console.error('Failed to delete field:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete field', life: 3000 })
  }
}

// Reorder fields
const onRowReorder = async (event) => {
  fields.value = event.value
  const orderedUuids = fields.value.map(f => f.uuid)
  
  try {
    await service.value.reorder(props.parentUuid, orderedUuids)
  } catch (error) {
    console.error('Failed to reorder fields:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to reorder fields', life: 3000 })
    await loadFields() // Reload to restore order
  }
}

// Lifecycle
onMounted(() => {
  loadFields()
})
</script>
