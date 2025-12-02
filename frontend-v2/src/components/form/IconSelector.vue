<template>
  <div class="icon-selector">
    <!-- Trigger button showing selected icon -->
    <Button
      type="button"
      :label="selectedValue ? undefined : $t('common.selectIcon')"
      :icon="selectedValue ? `pi ${selectedValue}` : 'pi pi-image'"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default v-if="selectedValue">
        <i :class="`pi ${selectedValue} mr-2`" />
        <span class="text-sm text-surface-600 dark:text-surface-300">{{ selectedValue }}</span>
      </template>
    </Button>

    <!-- Fullscreen Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="$t('common.selectIcon')"
      :style="{ width: '90vw', height: '90vh' }"
      :breakpoints="{ '960px': '95vw' }"
      class="icon-selector-dialog"
      :draggable="false"
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
      <div class="icon-grid-container overflow-auto" style="height: calc(90vh - 180px);">
        <template v-if="searchQuery">
          <!-- Flat grid when searching -->
          <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2">
            <button
              v-for="icon in filteredIcons"
              :key="icon"
              type="button"
              class="icon-item p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
              :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': selectedValue === icon }"
              @click="selectIcon(icon)"
            >
              <i :class="`pi ${icon} text-xl`" />
              <span class="text-xs text-surface-500 dark:text-surface-400 truncate w-full text-center">
                {{ icon.replace('pi-', '') }}
              </span>
            </button>
          </div>
          <div v-if="filteredIcons.length === 0" class="text-center py-8 text-surface-500">
            {{ $t('common.noResults') }}
          </div>
        </template>
        <template v-else>
          <!-- Categorized grid -->
          <div v-for="(category, key) in iconCategories" :key="key" class="mb-6">
            <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-2 sticky top-0 bg-surface-0 dark:bg-surface-900 py-2 z-10">
              {{ category.label }}
            </h3>
            <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 xl:grid-cols-14 gap-2">
              <button
                v-for="icon in category.icons"
                :key="icon"
                type="button"
                class="icon-item p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
                :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': selectedValue === icon }"
                @click="selectIcon(icon)"
              >
                <i :class="`pi ${icon} text-xl`" />
                <span class="text-xs text-surface-500 dark:text-surface-400 truncate w-full text-center">
                  {{ icon.replace('pi-', '') }}
                </span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-sm text-surface-500">
            <span v-if="selectedValue">
              {{ $t('common.selected') }}: <i :class="`pi ${selectedValue} mx-1`" /> {{ selectedValue }}
            </span>
          </div>
          <div class="flex gap-2">
            <Button
              :label="$t('common.clear')"
              severity="secondary"
              text
              @click="clearSelection"
            />
            <Button
              :label="$t('common.cancel')"
              severity="secondary"
              @click="dialogVisible = false"
            />
            <Button
              :label="$t('common.confirm')"
              @click="confirmSelection"
            />
          </div>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import { iconCategories, searchIcons } from '@/utils/primeIcons'

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
const searchQuery = ref('')
const tempSelection = ref(null)

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredIcons = computed(() => {
  return searchIcons(searchQuery.value)
})

const openDialog = () => {
  tempSelection.value = props.modelValue
  dialogVisible.value = true
}

const selectIcon = (icon) => {
  tempSelection.value = icon
  selectedValue.value = icon
}

const clearSelection = () => {
  tempSelection.value = null
  selectedValue.value = null
}

const confirmSelection = () => {
  selectedValue.value = tempSelection.value
  dialogVisible.value = false
}
</script>

<style scoped>
.icon-item:focus {
  outline: 2px solid var(--p-primary-500);
  outline-offset: 2px;
}

.icon-selector-dialog :deep(.p-dialog-content) {
  padding-bottom: 0;
}
</style>
