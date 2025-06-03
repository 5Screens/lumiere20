<template>
  <div 
    :class="[
      's-date-picker', 
      { 's-date-picker--editing': isEditing,
        's-date-picker--error': showRequiredError }
    ]"
  >
    <div class="s-date-picker__label-container" v-if="label">
      <label 
        :class="[
          's-date-picker__label',
          { 's-date-picker__label--required': required }
        ]"
      >
        {{ label }}
      </label>
    </div>
    
    <div class="s-date-picker__input-container">
      <input
        type="text"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        readonly
        :class="[
          's-date-picker__input',
          { 's-date-picker__input--error': error || showRequiredError }
        ]"
        @click="toggleCalendar"
      />
      
      <div 
        class="s-date-picker__calendar-icon" 
        @click="toggleCalendar"
        v-if="!disabled"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      
      <div v-if="isEditing && valueChanged && edition" class="s-date-picker__actions">
        <RgButton
          @confirm="confirmChange"
          @cancel="cancelChange"
          :disabled="disabled"
        />
      </div>
    </div>
    
    <!-- Calendrier en position absolue par rapport au document -->
    <div v-if="showCalendar" class="s-date-picker__calendar-container" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999; background-color: var(--bg-color); border: 1px solid var(--border-color); box-shadow: 0 4px 10px var(--shadow-color);">
      <div style="background-color: var(--primary-color); color: white; padding: 8px; text-align: center; font-weight: 500;">
        {{ label || 'Sélectionnez une date' }}
      </div>
      
      <!-- En-tête du calendrier avec navigation -->
      <div class="s-date-picker__calendar-header">
        <button 
          class="s-date-picker__nav-button" 
          @click="previousMonth"
          type="button"
        >
          &lt;
        </button>
        <span class="s-date-picker__month-year">{{ currentMonthName }} {{ currentYear }}</span>
        <button 
          class="s-date-picker__nav-button" 
          @click="nextMonth"
          type="button"
        >
          &gt;
        </button>
      </div>
      
      <!-- Jours de la semaine -->
      <div class="s-date-picker__weekdays">
        <div v-for="day in weekdays" :key="day">{{ day }}</div>
      </div>
      
      <!-- Jours du mois -->
      <div class="s-date-picker__days">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="[
            's-date-picker__day',
            { 's-date-picker__day--disabled': !day.currentMonth },
            { 's-date-picker__day--today': day.isToday },
            { 's-date-picker__day--selected': day.isSelected }
          ]"
          @click="selectDate(day)"
        >
          {{ day.day }}
        </div>
      </div>
      
      <!-- Pied du calendrier avec boutons d'action -->
      <div class="s-date-picker__footer">
        <button 
          class="s-date-picker__footer-button" 
          @click="setToday"
          type="button"
        >
          {{ t('datepicker.today') }}
        </button>
        <button 
          class="s-date-picker__footer-button" 
          @click="clearDate"
          type="button"
        >
          {{ t('datepicker.clear') }}
        </button>
        <button 
          class="s-date-picker__footer-button" 
          @click="closeCalendar"
          type="button"
          style="background-color: var(--error-color); color: white;"
        >
          Fermer
        </button>
      </div>
    </div>
    
    <span v-if="showRequiredError" class="s-date-picker__error">{{ t('errors.requiredField') }}</span>
    <span v-else-if="error" class="s-date-picker__error">{{ error }}</span>
    <span v-else-if="helperText" class="s-date-picker__helper">{{ helperText }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import RgButton from './rgButton.vue'
import apiService from '@/services/apiService'
import '@/assets/styles/sDatePicker.css'

const { t } = useI18n()

// État du composant
const isEditing = ref(false)
const showCalendar = ref(false)
const selectedDate = ref(null)
const originalDate = ref(null)
const valueChanged = ref(false)
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

// Jours de la semaine (abrégés)
const weekdays = [
  t('datepicker.weekdays.su'),
  t('datepicker.weekdays.mo'),
  t('datepicker.weekdays.tu'),
  t('datepicker.weekdays.we'),
  t('datepicker.weekdays.th'),
  t('datepicker.weekdays.fr'),
  t('datepicker.weekdays.sa')
]

// Props
const props = defineProps({
  label: {
    type: String,
    default: ''
  },
  modelValue: {
    type: [String, Date, null],
    default: null
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  helperText: {
    type: String,
    default: ''
  },
  uuid: {
    type: String,
    default: ''
  },
  fieldName: {
    type: String,
    default: ''
  },
  patchendpoint: {
    type: String,
    default: ''
  },
  edition: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'update:success', 'update:error'])

// Computed properties
const displayValue = computed(() => {
  if (!selectedDate.value) return ''
  
  const date = new Date(selectedDate.value)
  return date.toLocaleDateString()
})

const currentMonthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleDateString(undefined, { month: 'long' })
})

const calendarDays = computed(() => {
  const days = []
  
  // Premier jour du mois
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  // Dernier jour du mois
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  
  // Jours du mois précédent pour compléter la première semaine
  const firstDayOfWeek = firstDay.getDay()
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 1, day)
    days.push({
      day,
      date,
      currentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  // Jours du mois courant
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(currentYear.value, currentMonth.value, day)
    days.push({
      day,
      date,
      currentMonth: true,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  // Jours du mois suivant pour compléter la dernière semaine
  const lastDayOfWeek = lastDay.getDay()
  const daysToAdd = 6 - lastDayOfWeek
  
  for (let day = 1; day <= daysToAdd; day++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, day)
    days.push({
      day,
      date,
      currentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  return days
})

const showRequiredError = computed(() => {
  return props.required && !selectedDate.value && isEditing.value
})

// Methods
function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

function isSelectedDate(date) {
  if (!selectedDate.value) return false
  
  const selected = new Date(selectedDate.value)
  return date.getDate() === selected.getDate() &&
         date.getMonth() === selected.getMonth() &&
         date.getFullYear() === selected.getFullYear()
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function selectDate(day) {
  if (!day.currentMonth) {
    // Si on sélectionne un jour du mois précédent ou suivant, changer de mois
    if (day.date < new Date(currentYear.value, currentMonth.value, 1)) {
      previousMonth()
    } else {
      nextMonth()
    }
  }
  
  selectedDate.value = day.date
  valueChanged.value = !areDatesEqual(selectedDate.value, originalDate.value)
  
  if (!props.edition) {
    emit('update:modelValue', selectedDate.value)
    closeCalendar()
  }
}

function setToday() {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
  selectedDate.value = today
  valueChanged.value = !areDatesEqual(selectedDate.value, originalDate.value)
  
  if (!props.edition) {
    emit('update:modelValue', selectedDate.value)
    closeCalendar()
  }
}

function clearDate() {
  selectedDate.value = null
  valueChanged.value = originalDate.value !== null
  
  if (!props.edition) {
    emit('update:modelValue', null)
    closeCalendar()
  }
}

function toggleCalendar() {
  if (props.disabled) return
  
  console.log('toggleCalendar appelé', { showCalendar: !showCalendar.value, disabled: props.disabled })
  showCalendar.value = !showCalendar.value
  
  if (showCalendar.value) {
    // Si une date est déjà sélectionnée, mettre à jour le mois et l'année
    if (selectedDate.value) {
      const date = new Date(selectedDate.value)
      currentMonth.value = date.getMonth()
      currentYear.value = date.getFullYear()
    }
    
    // Ajouter un gestionnaire d'événements pour fermer le calendrier lors d'un clic en dehors
    document.addEventListener('click', handleClickOutside)
  }
}

function closeCalendar() {
  showCalendar.value = false
  document.removeEventListener('click', handleClickOutside)
}

async function confirmChange() {
  if (!props.uuid || !props.fieldname || !props.patchendpoint) {
    console.error('Erreur lors de la mise à jour de la date: paramètres manquants', { 
      uuid: props.uuid, 
      fieldname: props.fieldname, 
      patchendpoint: props.patchendpoint 
    })
    return
  }
  
  try {
    const response = await apiService.patch(`${props.patchendpoint}/${props.uuid}`, {
      [props.fieldname]: selectedDate.value
    })
    
    if (response.status === 200) {
      emit('update:modelValue', selectedDate.value)
      emit('update:success', response.data)
      originalDate.value = selectedDate.value
      valueChanged.value = false
      isEditing.value = false
    }
  } catch (error) {
    console.error('Error updating date:', error)
    emit('update:error', error)
  }
}

function cancelChange() {
  selectedDate.value = originalDate.value
  valueChanged.value = false
  isEditing.value = false
}

function areDatesEqual(date1, date2) {
  if (!date1 && !date2) return true
  if (!date1 || !date2) return false
  
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear()
}

function handleClickOutside(event) {
  // Si le clic est en dehors du composant et que le calendrier est ouvert, le fermer
  if (showCalendar.value && !event.target.closest('.s-date-picker') && !event.target.closest('.s-date-picker__calendar-container')) {
    closeCalendar()
  }
}

// Initialiser le composant
onMounted(() => {
  console.log('sDatePicker monté', { 
    label: props.label,
    modelValue: props.modelValue,
    uuid: props.uuid
  })
  
  // Si modelValue est fourni, l'utiliser comme valeur initiale
  if (props.modelValue) {
    selectedDate.value = new Date(props.modelValue)
    originalDate.value = new Date(props.modelValue)
    
    // Mettre à jour le mois et l'année affichés
    currentMonth.value = selectedDate.value.getMonth()
    currentYear.value = selectedDate.value.getFullYear()
  }
})

// Surveiller les changements de modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = new Date(newValue)
    if (!isEditing.value) {
      originalDate.value = new Date(newValue)
    }
  } else {
    selectedDate.value = null
    if (!isEditing.value) {
      originalDate.value = null
    }
  }
})
</script>
