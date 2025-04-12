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
      
      <Transition name="calendar">
        <div v-if="showCalendar" class="s-date-picker__calendar-container" v-click-outside="closeCalendar">
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
          </div>
        </div>
      </Transition>
      
      <span v-if="showRequiredError" class="s-date-picker__error">{{ t('errors.requiredField') }}</span>
      <span v-else-if="error" class="s-date-picker__error">{{ error }}</span>
      <span v-else-if="helperText" class="s-date-picker__helper">{{ helperText }}</span>
    </div>
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
  fieldname: {
    type: String,
    default: ''
  },
  endpoint: {
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

const emit = defineEmits(['update:modelValue', 'update:success'])

// Computed property pour vérifier si le champ est obligatoire et vide
const showRequiredError = computed(() => {
  return props.required && !selectedDate.value
})

// Computed property pour afficher la date au format localisé
const displayValue = computed(() => {
  if (!selectedDate.value) return ''
  
  // Format: DD/MM/YYYY
  const date = new Date(selectedDate.value)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
})

// Computed property pour le nom du mois actuel
const currentMonthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleString('default', { month: 'long' })
})

// Computed property pour générer les jours du calendrier
const calendarDays = computed(() => {
  const days = []
  
  // Premier jour du mois actuel
  const firstDayOfMonth = new Date(currentYear.value, currentMonth.value, 1)
  const firstDayOfWeek = firstDayOfMonth.getDay()
  
  // Dernier jour du mois actuel
  const lastDayOfMonth = new Date(currentYear.value, currentMonth.value + 1, 0)
  const lastDate = lastDayOfMonth.getDate()
  
  // Ajouter les jours du mois précédent pour compléter la première semaine
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevMonthDay = prevMonthLastDay - i
    const date = new Date(currentYear.value, currentMonth.value - 1, prevMonthDay)
    
    days.push({
      day: prevMonthDay,
      date: date,
      currentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  // Ajouter les jours du mois actuel
  for (let i = 1; i <= lastDate; i++) {
    const date = new Date(currentYear.value, currentMonth.value, i)
    
    days.push({
      day: i,
      date: date,
      currentMonth: true,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  // Ajouter les jours du mois suivant pour compléter la dernière semaine
  const remainingDays = 42 - days.length // 6 semaines * 7 jours = 42
  
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(currentYear.value, currentMonth.value + 1, i)
    
    days.push({
      day: i,
      date: date,
      currentMonth: false,
      isToday: isToday(date),
      isSelected: isSelectedDate(date)
    })
  }
  
  return days
})

// Vérifier si une date est aujourd'hui
function isToday(date) {
  const today = new Date()
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear()
}

// Vérifier si une date est sélectionnée
function isSelectedDate(date) {
  if (!selectedDate.value) return false
  
  const selected = new Date(selectedDate.value)
  return date.getDate() === selected.getDate() &&
         date.getMonth() === selected.getMonth() &&
         date.getFullYear() === selected.getFullYear()
}

// Naviguer au mois précédent
function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

// Naviguer au mois suivant
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

// Sélectionner une date
function selectDate(day) {
  if (!day.currentMonth) {
    // Si on clique sur un jour du mois précédent ou suivant, changer de mois
    if (day.date < new Date(currentYear.value, currentMonth.value, 1)) {
      previousMonth()
    } else {
      nextMonth()
    }
  }
  
  selectedDate.value = new Date(day.date)
  emit('update:modelValue', selectedDate.value)
  
  // Vérifier si la valeur a changé
  valueChanged.value = !areDatesEqual(selectedDate.value, originalDate.value)
  
  // Si on n'est pas en mode édition, fermer le calendrier après sélection
  if (!props.edition) {
    showCalendar.value = false
  }
}

// Définir la date à aujourd'hui
function setToday() {
  const today = new Date()
  currentMonth.value = today.getMonth()
  currentYear.value = today.getFullYear()
  selectedDate.value = today
  emit('update:modelValue', selectedDate.value)
  
  // Vérifier si la valeur a changé
  valueChanged.value = !areDatesEqual(selectedDate.value, originalDate.value)
  
  // Si on n'est pas en mode édition, fermer le calendrier après sélection
  if (!props.edition) {
    showCalendar.value = false
  }
}

// Effacer la date
function clearDate() {
  selectedDate.value = null
  emit('update:modelValue', null)
  
  // Vérifier si la valeur a changé
  valueChanged.value = originalDate.value !== null
  
  // Si on n'est pas en mode édition, fermer le calendrier après sélection
  if (!props.edition) {
    showCalendar.value = false
  }
}

// Ouvrir/fermer le calendrier
function toggleCalendar() {
  if (props.disabled) return
  
  showCalendar.value = !showCalendar.value
  
  if (showCalendar.value) {
    isEditing.value = true
    
    // Si une date est sélectionnée, afficher le mois correspondant
    if (selectedDate.value) {
      const date = new Date(selectedDate.value)
      currentMonth.value = date.getMonth()
      currentYear.value = date.getFullYear()
    }
  }
}

// Fermer le calendrier
function closeCalendar(event) {
  showCalendar.value = false
  
  // Ne pas réinitialiser isEditing si on est en mode édition et que la valeur a changé
  if (!(props.edition && valueChanged.value)) {
    isEditing.value = false
  }
}

// Confirmer le changement (en mode édition)
async function confirmChange() {
  if (!props.uuid || !props.patchendpoint) {
    console.warn('UUID ou endpoint PATCH non fourni pour la mise à jour du champ')
    return
  }
  
  try {
    // Préparer l'endpoint avec l'UUID
    const endpointWithUuid = `${props.patchendpoint}/${props.uuid}`
    
    // Préparer les données pour la requête PATCH
    const data = {
      [props.fieldname]: selectedDate.value ? selectedDate.value.toISOString().split('T')[0] : null
    }
    
    // Utiliser apiService pour faire la requête PATCH
    const response = await apiService.patch(endpointWithUuid, data)
    
    // Mettre à jour la valeur originale après une mise à jour réussie
    originalDate.value = selectedDate.value ? new Date(selectedDate.value) : null
    valueChanged.value = false
    isEditing.value = false
    showCalendar.value = false
    
    // Émettre un événement de succès
    emit('update:success', {
      success: true,
      fieldName: props.fieldname,
      value: selectedDate.value
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du champ:', error)
    emit('update:success', {
      success: false,
      fieldName: props.fieldname,
      value: selectedDate.value,
      error: error.message
    })
  }
}

// Annuler le changement (en mode édition)
function cancelChange() {
  // Réinitialiser à la valeur originale
  selectedDate.value = originalDate.value ? new Date(originalDate.value) : null
  emit('update:modelValue', selectedDate.value)
  
  // Réinitialiser les états
  isEditing.value = false
  valueChanged.value = false
  showCalendar.value = false
}

// Comparer deux dates
function areDatesEqual(date1, date2) {
  if (!date1 && !date2) return true
  if (!date1 || !date2) return false
  
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  
  return d1.getDate() === d2.getDate() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getFullYear() === d2.getFullYear()
}

// Initialiser le composant
onMounted(async () => {
  // Si modelValue est fourni, l'utiliser comme valeur initiale
  if (props.modelValue) {
    selectedDate.value = new Date(props.modelValue)
    originalDate.value = new Date(props.modelValue)
  } else if (props.edition && props.endpoint && props.uuid) {
    // En mode édition, si aucune valeur n'est fournie mais qu'un endpoint est disponible,
    // essayer de récupérer la valeur depuis l'API
    try {
      const endpointWithUuid = `${props.endpoint}/${props.uuid}`
      const response = await apiService.get(endpointWithUuid)
      
      if (response && response[props.fieldname]) {
        selectedDate.value = new Date(response[props.fieldname])
        originalDate.value = new Date(response[props.fieldname])
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la date:', error)
    }
  }
  
  // Ajouter un gestionnaire de clic global pour fermer le calendrier
  document.addEventListener('click', handleClickOutside)
})

// Nettoyer les écouteurs d'événements
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Gestionnaire de clic en dehors du composant
function handleClickOutside(event) {
  const el = event.target
  const datePicker = document.querySelector('.s-date-picker')
  
  if (datePicker && !datePicker.contains(el) && showCalendar.value) {
    closeCalendar()
  }
}

// Directive personnalisée pour détecter les clics en dehors d'un élément
const vClickOutside = {
  beforeMount(el, binding) {
    el.clickOutsideEvent = function(event) {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }
    document.addEventListener('click', el.clickOutsideEvent, { capture: true })
  },
  unmounted(el) {
    document.removeEventListener('click', el.clickOutsideEvent, { capture: true })
  }
}

// Surveiller les changements de modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDate.value = new Date(newValue)
    
    // Si c'est la première fois qu'on définit la valeur, initialiser aussi originalDate
    if (!originalDate.value) {
      originalDate.value = new Date(newValue)
    }
  } else {
    selectedDate.value = null
    
    // Si c'est la première fois qu'on définit la valeur, initialiser aussi originalDate
    if (originalDate.value === undefined) {
      originalDate.value = null
    }
  }
})
</script>
