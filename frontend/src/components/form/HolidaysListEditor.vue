<template>
  <div class="holidays-list-editor flex flex-col gap-3">
    <!-- Holidays list -->
    <div 
      v-for="(holiday, index) in sortedHolidays" 
      :key="index"
      class="flex items-center gap-2 p-2 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-all"
    >
      <DatePicker
        :modelValue="toDate(holiday.date)"
        @update:modelValue="updateHolidayDate(index, $event)"
        dateFormat="dd/mm/yy"
        :disabled="disabled"
        :placeholder="$t('holidays.selectDate')"
        showButtonBar
        class="w-40"
      />
      <InputText
        :modelValue="holiday.name"
        @update:modelValue="updateHolidayName(index, $event)"
        :disabled="disabled"
        :placeholder="$t('holidays.name')"
        class="flex-1"
      />
      <Button
        icon="pi pi-trash"
        severity="danger"
        text
        rounded
        size="small"
        :disabled="disabled"
        @click="removeHoliday(index)"
        v-tooltip.right="$t('common.delete')"
      />
    </div>

    <!-- Empty state -->
    <div v-if="!holidays.length" class="text-center py-4 text-surface-400 italic text-sm">
      {{ $t('holidays.empty') }}
    </div>

    <!-- Add button -->
    <Button
      :label="$t('holidays.add')"
      icon="pi pi-plus"
      severity="secondary"
      outlined
      size="small"
      :disabled="disabled"
      @click="addHoliday"
      class="self-start"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DatePicker from 'primevue/datepicker'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const holidays = computed(() => props.modelValue || [])

const sortedHolidays = computed(() => {
  return [...holidays.value].sort((a, b) => {
    if (!a.date) return 1
    if (!b.date) return -1
    return a.date.localeCompare(b.date)
  })
})

const toDate = (dateStr) => {
  if (!dateStr) return null
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const formatDate = (date) => {
  if (!date) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const emitUpdate = (newList) => {
  emit('update:modelValue', [...newList])
}

const addHoliday = () => {
  const newList = [...holidays.value, { date: '', name: '' }]
  emitUpdate(newList)
}

const removeHoliday = (index) => {
  const sorted = [...sortedHolidays.value]
  sorted.splice(index, 1)
  emitUpdate(sorted)
}

const updateHolidayDate = (index, dateValue) => {
  const sorted = [...sortedHolidays.value]
  sorted[index] = { ...sorted[index], date: formatDate(dateValue) }
  emitUpdate(sorted)
}

const updateHolidayName = (index, name) => {
  const sorted = [...sortedHolidays.value]
  sorted[index] = { ...sorted[index], name }
  emitUpdate(sorted)
}
</script>
