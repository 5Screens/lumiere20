<template>
  <div class="flex flex-col h-full" style="min-height: 400px;">
    <!-- UUID Display (only in edit mode) -->
    <UuidDisplay v-if="mode === 'edit'" :uuid="modelValue?.uuid" />
    
    <!-- Tabs -->
    <Tabs v-model:value="activeTab" class="flex-1 flex flex-col min-h-0">
      <TabList class="shrink-0">
        <Tab value="general">
          <i class="pi pi-file-edit mr-2" />
          {{ $t('common.generalInfo') }}
        </Tab>
        <Tab v-if="hasExtendedInfo" value="extended">
          <i class="pi pi-list mr-2" />
          {{ $t('common.extendedInfo') }}
        </Tab>
      </TabList>
      
      <TabPanels class="flex-1 min-h-0 overflow-hidden">
        <!-- General Info Tab -->
        <TabPanel value="general" class="h-full overflow-auto">
          <ObjectGeneralInfo 
            :modelValue="modelValue"
            @update:modelValue="$emit('update:modelValue', $event)"
            :formFields="formFields"
            :fieldOptions="fieldOptions"
            :loading="false"
            :forced-ci-type-uuid="forcedCiTypeUuid"
          />
        </TabPanel>

        <!-- Extended Info Tab -->
        <TabPanel v-if="hasExtendedInfo" value="extended" class="h-full overflow-auto">
          <ObjectExtendedInfo 
            :modelValue="modelValue"
            @update:modelValue="$emit('update:modelValue', $event)"
            :objectType="objectType"
            :extendedFields="extendedFields"
            :loading="extendedFieldsLoading"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// PrimeVue components
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// Custom components
import ObjectGeneralInfo from './ObjectGeneralInfo.vue'
import ObjectExtendedInfo from './ObjectExtendedInfo.vue'
import UuidDisplay from '@/components/form/UuidDisplay.vue'

// Props
const props = defineProps({
  // The object being edited (v-model)
  modelValue: {
    type: Object,
    required: true
  },
  // Form fields metadata
  formFields: {
    type: Array,
    required: true
  },
  // Object type (e.g., 'configuration_items', 'persons')
  objectType: {
    type: String,
    required: true
  },
  // Field options cache (for select fields)
  fieldOptions: {
    type: Object,
    default: () => ({})
  },
  // CI types for configuration_items (kept for compatibility)
  ciTypes: {
    type: Array,
    default: () => []
  },
  // Extended fields for configuration_items
  extendedFields: {
    type: Array,
    default: () => []
  },
  // Loading state for extended fields
  extendedFieldsLoading: {
    type: Boolean,
    default: false
  },
  // Field currently being refreshed (kept for compatibility)
  refreshingField: {
    type: String,
    default: null
  },
  // Mode: 'create' or 'edit'
  mode: {
    type: String,
    default: 'create'
  },
  // Forced CI type UUID (when creating from a filtered tab)
  forcedCiTypeUuid: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'ci-type-change',
  'refresh-options'
])

// State
const activeTab = ref('general')

// Computed
const hasExtendedInfo = computed(() => {
  // Show extended tab for ci_types and configuration_items
  return ['ci_types', 'configuration_items'].includes(props.objectType)
})
</script>
