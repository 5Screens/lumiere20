<template>
  <div class="person-selector">
    <!-- Trigger button showing selected person -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default>
        <div v-if="selectedPerson" class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xs font-semibold">
            {{ getInitials(selectedPerson) }}
          </div>
          <span>{{ selectedPerson.first_name }} {{ selectedPerson.last_name }}</span>
        </div>
        <span v-else class="text-surface-400">
          {{ $t('common.selectPerson') }}
        </span>
      </template>
    </Button>

    <!-- Person Picker Dialog -->
    <PersonPicker
      v-model="localValue"
      v-model:show="dialogVisible"
      :title="$t('common.selectPerson')"
      @confirm="onConfirm"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Button from 'primevue/button'
import { PersonPicker } from '@/components/pickers'
import personsService from '@/services/personsService'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const dialogVisible = ref(false)
const localValue = ref(null)
const selectedPerson = ref(null)

// Get initials for avatar
const getInitials = (person) => {
  const first = person?.first_name?.[0] || ''
  const last = person?.last_name?.[0] || ''
  return (first + last).toUpperCase()
}

// Load person details for display
const loadSelectedPerson = async () => {
  if (!props.modelValue) {
    selectedPerson.value = null
    return
  }
  
  try {
    const person = await personsService.getByUuid(props.modelValue)
    selectedPerson.value = person
  } catch (error) {
    console.error('Failed to load person:', error)
    selectedPerson.value = null
  }
}

const openDialog = () => {
  localValue.value = props.modelValue
  dialogVisible.value = true
}

const onConfirm = async (value) => {
  emit('update:modelValue', value)
  dialogVisible.value = false
  
  // Update selected person display
  if (value) {
    try {
      const person = await personsService.getByUuid(value)
      selectedPerson.value = person
    } catch (error) {
      console.error('Failed to load person:', error)
    }
  } else {
    selectedPerson.value = null
  }
}

// Load selected person on mount
onMounted(() => {
  if (props.modelValue) {
    loadSelectedPerson()
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    loadSelectedPerson()
  }
})
</script>
