<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="$t('common.selectIcon')"
    :style="{ width: '90vw', height: '90vh' }"
    :draggable="false"
    @hide="onCancel"
  >
    <!-- Search bar -->
    <div class="mb-4 flex gap-2">
      <IconField class="flex-1">
        <InputIcon class="pi pi-search" />
        <InputText
          v-model="searchQuery"
          :placeholder="$t('common.searchIcon')"
          class="w-full"
        />
      </IconField>
      <Button
        v-if="searchQuery"
        icon="pi pi-times"
        severity="secondary"
        text
        @click="searchQuery = ''"
      />
    </div>

    <!-- Icons grid -->
    <div class="overflow-auto" style="height: calc(90vh - 180px);">
      <template v-if="searchQuery">
        <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
          <button
            v-for="icon in filteredIcons"
            :key="icon"
            type="button"
            class="icon-item p-3 rounded-lg border-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
            :class="localValue === icon ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-2 ring-primary-500/30' : 'border-surface-200 dark:border-surface-700'"
            @click="selectIcon(icon)"
          >
            <i :class="`pi ${icon} text-xl`" />
            <span class="text-xs text-surface-500 truncate w-full text-center">{{ icon.replace('pi-', '') }}</span>
          </button>
        </div>
        <div v-if="filteredIcons.length === 0" class="text-center py-8 text-surface-500">
          {{ $t('common.noResults') }}
        </div>
      </template>
      <template v-else>
        <div v-for="(category, key) in iconCategories" :key="key" class="mb-6">
          <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-2 sticky top-0 bg-surface-0 dark:bg-surface-900 py-2 z-10">
            {{ category.label }}
          </h3>
          <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            <button
              v-for="icon in category.icons"
              :key="icon"
              type="button"
              class="icon-item p-3 rounded-lg border-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
              :class="localValue === icon ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-500 ring-2 ring-primary-500/30' : 'border-surface-200 dark:border-surface-700'"
              @click="selectIcon(icon)"
            >
              <i :class="`pi ${icon} text-xl`" />
              <span class="text-xs text-surface-500 truncate w-full text-center">{{ icon.replace('pi-', '') }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-between items-center w-full">
        <div class="text-sm text-surface-500">
          <span v-if="localValue">
            {{ $t('common.selected') }}: <i :class="`pi ${localValue} mx-1`" /> {{ localValue }}
          </span>
        </div>
        <div class="flex gap-2">
          <Button :label="$t('common.clear')" severity="secondary" text @click="localValue = null" />
          <Button :label="$t('common.cancel')" severity="secondary" @click="onCancel" />
          <Button :label="$t('common.confirm')" @click="onConfirm" :loading="loading" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { iconCategories, searchIcons } from '@/utils/primeIcons'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  show: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update:show', 'confirm', 'cancel'])

const searchQuery = ref('')
const localValue = ref(null)

const visible = computed({
  get: () => props.show,
  set: (val) => emit('update:show', val)
})

const filteredIcons = computed(() => searchIcons(searchQuery.value))

const selectIcon = (icon) => {
  console.log('[IconPicker] selectIcon called with:', icon)
  console.log('[IconPicker] localValue before:', localValue.value)
  localValue.value = icon
  console.log('[IconPicker] localValue after:', localValue.value)
}

// Sync local value with prop when dialog opens
watch(() => props.show, (newVal) => {
  if (newVal) {
    localValue.value = props.modelValue
    searchQuery.value = ''
  }
})

const onConfirm = () => {
  emit('update:modelValue', localValue.value)
  emit('confirm', localValue.value)
}

const onCancel = () => {
  visible.value = false
  emit('cancel')
}
</script>
