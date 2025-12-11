<template>
  <div class="translatable-input">
    <!-- Trigger button showing current value -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-between"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default>
        <span class="truncate text-left flex-1">
          {{ displayValue || placeholder }}
        </span>
        <i class="pi pi-pencil text-surface-400 ml-2" />
      </template>
    </Button>

    <!-- Use TranslatablePicker for editing translations -->
    <TranslatablePicker
      v-model="tempTranslations"
      :show="dialogVisible"
      :title="dialogTitle"
      :languages="availableLanguages"
      :field-type="multiline ? 'textarea' : 'text'"
      @update:show="dialogVisible = $event"
      @confirm="confirmDialog"
      @cancel="dialogVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import { TranslatablePicker } from '@/components/pickers'
import languagesService from '@/services/languagesService'

const props = defineProps({
  // The main field value (default/fallback)
  modelValue: {
    type: String,
    default: ''
  },
  // The translations object { fr: '...', en: '...', ... }
  translations: {
    type: Object,
    default: () => ({})
  },
  // Field name for the dialog title
  fieldLabel: {
    type: String,
    default: ''
  },
  // Placeholder when empty
  placeholder: {
    type: String,
    default: ''
  },
  // Whether to use textarea (multiline) or input (single line)
  multiline: {
    type: Boolean,
    default: false
  },
  // Disabled state
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:translations'])

const { t, locale } = useI18n()

// Available languages loaded from API
const availableLanguages = ref([])
const languagesLoading = ref(false)

// Load active languages from API
const loadActiveLanguages = async () => {
  languagesLoading.value = true
  availableLanguages.value = await languagesService.getActiveLanguagesWithFlags()
  languagesLoading.value = false
}

// Load languages on mount
onMounted(() => {
  loadActiveLanguages()
})

const dialogVisible = ref(false)
const tempTranslations = ref({})

// Dialog title
const dialogTitle = computed(() => {
  return props.fieldLabel 
    ? `${t('common.translate')} - ${props.fieldLabel}`
    : t('common.translate')
})

// Display value: show translation for current locale, or fallback to modelValue
const displayValue = computed(() => {
  const currentLocale = locale.value
  
  // First try translations
  if (props.translations && props.translations[currentLocale]) {
    return props.translations[currentLocale]
  }
  
  // Fallback to modelValue
  return props.modelValue || ''
})

// Open dialog and initialize temp values
const openDialog = () => {
  // Initialize temp translations from props
  tempTranslations.value = {}
  
  for (const lang of availableLanguages.value) {
    // Use existing translation or empty string
    tempTranslations.value[lang.code] = props.translations?.[lang.code] || ''
  }
  
  // If modelValue exists but no translations, use it as default for current locale
  if (props.modelValue && !props.translations?.[locale.value]) {
    tempTranslations.value[locale.value] = props.modelValue
  }
  
  dialogVisible.value = true
}

// Confirm and emit changes
const confirmDialog = (translations) => {
  // Build clean translations object (remove empty values)
  const cleanTranslations = {}
  for (const [code, value] of Object.entries(translations)) {
    if (value && value.trim()) {
      cleanTranslations[code] = value.trim()
    }
  }
  
  // Emit translations update
  emit('update:translations', cleanTranslations)
  
  // Also update modelValue with current locale value or first available
  const newValue = cleanTranslations[locale.value] 
    || Object.values(cleanTranslations)[0] 
    || ''
  emit('update:modelValue', newValue)
  
  dialogVisible.value = false
}
</script>

