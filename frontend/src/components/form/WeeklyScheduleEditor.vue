<template>
  <div class="weekly-schedule-editor flex flex-col gap-3">
    <div 
      v-for="day in weekDays" 
      :key="day.key"
      class="flex flex-col gap-2 p-3 rounded-lg border border-surface-200 dark:border-surface-700 transition-all"
      :class="{ 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200 dark:border-primary-800': hasSlots(day.key) }"
    >
      <!-- Day header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ToggleSwitch 
            :modelValue="hasSlots(day.key)"
            @update:modelValue="toggleDay(day.key, $event)"
            :disabled="disabled"
          />
          <span class="font-semibold text-sm">{{ $t(`weekDays.${day.key}`) }}</span>
        </div>
        <Button
          v-if="hasSlots(day.key)"
          icon="pi pi-plus"
          severity="secondary"
          text
          rounded
          size="small"
          :disabled="disabled"
          @click="addSlot(day.key)"
          v-tooltip.left="$t('schedule.addSlot')"
        />
      </div>

      <!-- Time slots -->
      <div v-if="hasSlots(day.key)" class="flex flex-col gap-2 ml-10">
        <div 
          v-for="(slot, index) in getSlots(day.key)" 
          :key="index"
          class="flex items-center gap-2"
        >
          <DatePicker
            :modelValue="parseTime(slot.start)"
            @update:modelValue="updateSlotTime(day.key, index, 'start', $event)"
            timeOnly
            hourFormat="24"
            :stepMinute="15"
            :disabled="disabled"
            :placeholder="$t('schedule.start')"
            class="w-28"
          />
          <span class="text-surface-500">—</span>
          <DatePicker
            :modelValue="parseTime(slot.end)"
            @update:modelValue="updateSlotTime(day.key, index, 'end', $event)"
            timeOnly
            hourFormat="24"
            :stepMinute="15"
            :disabled="disabled"
            :placeholder="$t('schedule.end')"
            class="w-28"
          />
          <Button
            icon="pi pi-trash"
            severity="danger"
            text
            rounded
            size="small"
            :disabled="disabled"
            @click="removeSlot(day.key, index)"
            v-tooltip.right="$t('common.delete')"
          />
        </div>
      </div>

      <!-- Closed label -->
      <div v-else class="ml-10 text-sm text-surface-400 italic">
        {{ $t('schedule.closed') }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import DatePicker from 'primevue/datepicker'
import Button from 'primevue/button'
import ToggleSwitch from 'primevue/toggleswitch'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const weekDays = [
  { key: 'monday' },
  { key: 'tuesday' },
  { key: 'wednesday' },
  { key: 'thursday' },
  { key: 'friday' },
  { key: 'saturday' },
  { key: 'sunday' }
]

const schedule = computed(() => props.modelValue || {})

const hasSlots = (day) => {
  const slots = schedule.value[day]
  return Array.isArray(slots) && slots.length > 0
}

const getSlots = (day) => {
  return schedule.value[day] || []
}

const emitUpdate = (newSchedule) => {
  emit('update:modelValue', { ...newSchedule })
}

const toggleDay = (day, enabled) => {
  const newSchedule = { ...schedule.value }
  if (enabled) {
    newSchedule[day] = [{ start: '09:00', end: '18:00' }]
  } else {
    delete newSchedule[day]
  }
  emitUpdate(newSchedule)
}

const addSlot = (day) => {
  const newSchedule = { ...schedule.value }
  const slots = [...(newSchedule[day] || [])]
  slots.push({ start: '09:00', end: '18:00' })
  newSchedule[day] = slots
  emitUpdate(newSchedule)
}

const removeSlot = (day, index) => {
  const newSchedule = { ...schedule.value }
  const slots = [...(newSchedule[day] || [])]
  slots.splice(index, 1)
  if (slots.length === 0) {
    delete newSchedule[day]
  } else {
    newSchedule[day] = slots
  }
  emitUpdate(newSchedule)
}

const parseTime = (timeStr) => {
  if (!timeStr) return null
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

const formatTime = (date) => {
  if (!date) return '00:00'
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

const updateSlotTime = (day, index, field, dateValue) => {
  const newSchedule = { ...schedule.value }
  const slots = [...(newSchedule[day] || [])]
  slots[index] = { ...slots[index], [field]: formatTime(dateValue) }
  newSchedule[day] = slots
  emitUpdate(newSchedule)
}
</script>
