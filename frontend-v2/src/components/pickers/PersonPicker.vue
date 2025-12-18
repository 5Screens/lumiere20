<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="title || $t('common.selectPerson')"
    :style="{ width: '90vw', maxWidth: '600px', height: 'auto', maxHeight: '80vh' }"
    :draggable="false"
    @hide="onCancel"
  >
    <!-- Search input -->
    <div class="mb-4">
      <InputText
        v-model="searchQuery"
        :placeholder="$t('common.searchPerson')"
        class="w-full"
        @input="onSearchInput"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- No results -->
    <div v-else-if="persons.length === 0 && searchQuery" class="flex flex-col items-center justify-center py-8 text-surface-500">
      <i class="pi pi-search text-4xl mb-4" />
      <p>{{ $t('common.noResults') }}</p>
    </div>

    <!-- Empty state -->
    <div v-else-if="persons.length === 0" class="flex flex-col items-center justify-center py-8 text-surface-500">
      <i class="pi pi-users text-4xl mb-4" />
      <p>{{ $t('common.typeToSearch') }}</p>
    </div>

    <!-- Persons list -->
    <div v-else class="flex flex-col gap-2 max-h-80 overflow-y-auto">
      <button
        v-for="person in persons"
        :key="person.uuid"
        type="button"
        class="person-item p-3 rounded-lg border-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex items-center gap-3 text-left"
        :class="localValue === person.uuid ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-2 ring-primary-500/30' : 'border-surface-200 dark:border-surface-700'"
        @click="localValue = person.uuid"
      >
        <!-- Avatar -->
        <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
          {{ getInitials(person) }}
        </div>
        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate">{{ person.first_name }} {{ person.last_name }}</div>
          <div class="text-sm text-surface-500 truncate">{{ person.email }}</div>
        </div>
        <!-- Job role badge -->
        <Tag 
          v-if="person.job_role" 
          :value="person.job_role" 
          severity="secondary"
          class="text-xs shrink-0"
        />
      </button>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button :label="$t('common.clear')" severity="secondary" text @click="localValue = null" />
        <Button :label="$t('common.cancel')" severity="secondary" @click="onCancel" />
        <Button :label="$t('common.confirm')" @click="onConfirm" :disabled="loading" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import personsService from '@/services/personsService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const localValue = ref(null)
const initialValue = ref(null)
const loading = ref(false)
const searchQuery = ref('')
const persons = ref([])
let searchTimeout = null

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

// Get initials for avatar
const getInitials = (person) => {
  const first = person.first_name?.[0] || ''
  const last = person.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

// Debounced search
const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    searchPersons()
  }, 300)
}

// Search persons via API
const searchPersons = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) {
    persons.value = []
    return
  }

  try {
    loading.value = true
    const result = await personsService.search({
      filters: {
        global: { value: searchQuery.value, matchMode: 'contains' }
      },
      page: 1,
      limit: 20,
      sortField: 'last_name',
      sortOrder: 1,
      globalSearchFields: ['first_name', 'last_name', 'email']
    })
    persons.value = result.data || []
  } catch (error) {
    console.error('Failed to search persons:', error)
    persons.value = []
  } finally {
    loading.value = false
  }
}

// Load initial selected person when dialog opens
watch(() => props.show, async (newVal) => {
  if (newVal) {
    localValue.value = props.modelValue
    initialValue.value = props.modelValue
    searchQuery.value = ''
    persons.value = []
    
    // If there's a selected value, load it to show in the list
    if (props.modelValue) {
      try {
        const person = await personsService.getByUuid(props.modelValue)
        if (person) {
          persons.value = [person]
        }
      } catch (error) {
        console.error('Failed to load selected person:', error)
      }
    }
  }
})

const onConfirm = () => {
  // Skip if no change
  if (localValue.value === initialValue.value) {
    visible.value = false
    return
  }
  emit('update:modelValue', localValue.value)
  emit('confirm', localValue.value)
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
