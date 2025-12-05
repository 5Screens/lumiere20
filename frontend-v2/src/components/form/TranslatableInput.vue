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

    <!-- Dialog for editing translations -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="dialogTitle"
      :style="{ width: '500px' }"
      :draggable="false"
    >
      <div class="flex flex-col gap-4">
        <!-- One field per language -->
        <div 
          v-for="lang in availableLanguages" 
          :key="lang.code"
          class="flex flex-col gap-2"
        >
          <label :for="`trans-${lang.code}`" class="flex items-center gap-2 font-medium">
            <span class="flag-circle" :title="lang.name">{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
          </label>
          
          <!-- Textarea for multiline -->
          <Textarea
            v-if="multiline"
            :id="`trans-${lang.code}`"
            v-model="tempTranslations[lang.code]"
            rows="3"
            class="w-full"
            :placeholder="`${lang.name}...`"
          />
          <!-- InputText for single line -->
          <InputText
            v-else
            :id="`trans-${lang.code}`"
            v-model="tempTranslations[lang.code]"
            class="w-full"
            :placeholder="`${lang.name}...`"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            :label="$t('common.cancel')" 
            severity="secondary" 
            @click="cancelDialog" 
          />
          <Button 
            :label="$t('common.confirm')" 
            @click="confirmDialog" 
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'

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

// Available languages with flags (emoji)
const availableLanguages = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
]

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
  
  for (const lang of availableLanguages) {
    // Use existing translation or empty string
    tempTranslations.value[lang.code] = props.translations?.[lang.code] || ''
  }
  
  // If modelValue exists but no translations, use it as default for current locale
  if (props.modelValue && !props.translations?.[locale.value]) {
    tempTranslations.value[locale.value] = props.modelValue
  }
  
  dialogVisible.value = true
}

// Cancel and close dialog
const cancelDialog = () => {
  dialogVisible.value = false
}

// Confirm and emit changes
const confirmDialog = () => {
  // Build clean translations object (remove empty values)
  const cleanTranslations = {}
  for (const [code, value] of Object.entries(tempTranslations.value)) {
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

<style scoped>
.flag-circle {
  font-size: 1.25rem;
  line-height: 1;
}

.translatable-input :deep(.p-button) {
  text-align: left;
}
</style>
