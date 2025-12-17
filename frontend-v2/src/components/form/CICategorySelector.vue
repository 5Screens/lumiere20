<template>
  <div class="ci-category-selector">
    <!-- Trigger button showing selected category -->
    <Button
      type="button"
      severity="secondary"
      outlined
      class="w-full justify-start"
      :disabled="disabled"
      @click="openDialog"
    >
      <template #default>
        <div v-if="selectedCategory" class="flex items-center gap-2">
          <i :class="`pi ${selectedCategory.icon || 'pi-folder'}`" />
          <span>{{ selectedCategory.label }}</span>
        </div>
        <span v-else class="text-surface-400">
          {{ $t('ciCategories.selectCategory') }}
        </span>
      </template>
    </Button>

    <!-- Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      modal
      :header="$t('ciCategories.selectCategory')"
      :style="{ width: '90vw', maxWidth: '600px', height: 'auto' }"
      class="ci-category-dialog"
      :draggable="false"
    >
      <!-- Loading state -->
      <div v-if="isLoading" class="flex justify-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl" />
      </div>

      <!-- Categories grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          v-for="category in categories"
          :key="category.uuid"
          type="button"
          class="category-item p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-2"
          :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': modelValue === category.uuid }"
          @click="selectCategory(category)"
        >
          <i :class="`pi ${category.icon || 'pi-folder'} text-2xl`" />
          <span class="text-sm font-medium text-center">{{ category.label }}</span>
          <i 
            v-if="modelValue === category.uuid" 
            class="pi pi-check text-primary-500"
          />
        </button>
      </div>

      <!-- Footer -->
      <template #footer>
        <div class="flex justify-end gap-2">
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
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { useReferenceDataStore } from '@/stores/referenceDataStore'

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

const { locale } = useI18n()
const referenceDataStore = useReferenceDataStore()
const dialogVisible = ref(false)

// Use store data
const categories = computed(() => referenceDataStore.ciCategories)
const isLoading = computed(() => referenceDataStore.loading.ciCategories)

/**
 * Find selected category object from UUID
 */
const selectedCategory = computed(() => {
  if (!props.modelValue) return null
  return categories.value.find(c => c.uuid === props.modelValue) || null
})

const openDialog = async () => {
  await referenceDataStore.loadCiCategories()
  dialogVisible.value = true
}

const selectCategory = (category) => {
  emit('update:modelValue', category.uuid)
  dialogVisible.value = false
}

const clearSelection = () => {
  emit('update:modelValue', null)
  dialogVisible.value = false
}

// Load categories on mount to display selected value
onMounted(async () => {
  if (props.modelValue) {
    await referenceDataStore.loadCiCategories()
  }
})

// Reload when locale changes (force reload to get new translations)
watch(locale, () => {
  referenceDataStore.loadCiCategories(true)
})
</script>

<style scoped>
.category-item:focus {
  outline: 2px solid var(--p-primary-500);
  outline-offset: 2px;
}
</style>
