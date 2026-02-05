<template>
  <div class="h-full flex flex-col">
    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <template v-else-if="item">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 px-4 pt-4">
        <h2 class="text-xl font-semibold">
          {{ getDisplayName() }}
        </h2>
        <div class="flex gap-2">
          <Button 
            icon="pi pi-times" 
            severity="danger"
            text
            rounded
            @click="onCancel"
            v-tooltip.bottom="$t('common.cancel')"
          />
          <Button 
            icon="pi pi-check" 
            severity="success"
            @click="onSave"
            :loading="saving"
            :disabled="!isDirty"
            v-tooltip.bottom="$t('common.save')"
          />
        </div>
      </div>

      <!-- UUID Display (only in edit mode) -->
      <UuidDisplay v-if="mode === 'edit'" :uuid="item?.uuid" class="px-4" />

      <!-- Tabs -->
      <Tabs v-model:value="activeTab" class="flex-1 flex flex-col min-h-0">
        <TabList class="shrink-0 px-4">
          <Tab value="general" :pt="{ root: { class: 'pl-0' } }">
            <i class="pi pi-file-edit mr-2" />
            {{ $t('common.generalInfo') }}
          </Tab>
          <Tab v-if="hasExtendedInfo" value="extended">
            <i class="pi pi-list mr-2" />
            {{ $t('common.extendedInfo') }}
          </Tab>
          <Tab v-if="hasRelatedTickets" value="tickets">
            <i class="pi pi-ticket mr-2" />
            {{ $t('persons.relatedTickets') }}
          </Tab>
          <Tab v-for="rlField in reverseLinkFields" :key="rlField.field_name" :value="rlField.field_name">
            <i class="pi pi-list mr-2" />
            {{ $t(rlField.label_key) }}
          </Tab>
        </TabList>
        
        <TabPanels class="flex-1 min-h-0 overflow-hidden" :pt="{ root: { class: 'p-0' } }">
          <!-- General Info Tab -->
          <TabPanel value="general" class="h-full overflow-auto">
            <ObjectGeneralInfo 
              ref="generalInfoRef"
              v-model="item"
              :formFields="formFields"
              :fieldOptions="fieldOptions"
              :loading="metadataLoading"
              :availableTransitions="availableTransitions"
              :objectType="objectType"
              :mode="mode"
              @apply-transition="applyTransition"
            />
          </TabPanel>

          <!-- Extended Info Tab -->
          <TabPanel v-if="hasExtendedInfo" value="extended" class="h-full overflow-auto">
            <ObjectExtendedInfo 
              v-model="item"
              :objectType="objectType"
              :extendedFields="extendedFields"
              :loading="extendedFieldsLoading"
            />
          </TabPanel>

          <!-- Related Tickets Tab (for persons) -->
          <TabPanel v-if="hasRelatedTickets" value="tickets" class="h-full overflow-auto">
            <RelatedTicketsList 
              v-if="item?.uuid"
              :personUuid="item.uuid"
            />
          </TabPanel>

          <!-- Reverse Link Tabs (e.g., service offerings for services) -->
          <TabPanel 
            v-for="rlField in reverseLinkFields" 
            :key="rlField.field_name" 
            :value="rlField.field_name" 
            class="h-full overflow-auto"
          >
            <ReverseLinkTable 
              v-if="item?.uuid"
              :field="rlField"
              :parentUuid="item.uuid"
              :parentType="objectType"
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>

    <!-- Not found -->
    <div v-else class="flex-1 flex items-center justify-center text-surface-500">
      <div class="text-center">
        <i class="pi pi-exclamation-circle text-4xl mb-4" />
        <p>{{ $t('common.notFound') }}</p>
      </div>
    </div>

    <!-- Unsaved changes confirmation dialog -->
    <Dialog 
      v-model:visible="confirmDialogVisible" 
      :header="$t('common.unsavedChanges')" 
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500" />
        <span>{{ $t('common.unsavedChangesMessage') }}</span>
      </div>
      <template #footer>
        <Button 
          :label="$t('common.no')" 
          icon="pi pi-times" 
          severity="secondary" 
          text 
          @click="confirmDialogVisible = false" 
        />
        <Button 
          :label="$t('common.yes')" 
          icon="pi pi-check" 
          severity="danger" 
          @click="confirmClose" 
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, toRef, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useObjectView } from '@/composables/useObjectView'
import { useTabsStore } from '@/stores/tabsStore'

// PrimeVue components
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'

// Custom components
import ObjectGeneralInfo from './ObjectGeneralInfo.vue'
import ObjectExtendedInfo from './ObjectExtendedInfo.vue'
import RelatedTicketsList from './RelatedTicketsList.vue'
import ReverseLinkTable from './ReverseLinkTable.vue'
import UuidDisplay from '@/components/form/UuidDisplay.vue'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  objectId: {
    type: String,
    default: null
  },
  mode: {
    type: String,
    default: 'edit' // 'edit' or 'create'
  },
  ciTypeUuid: {
    type: String,
    default: null
  },
  ticketTypeCode: {
    type: String,
    default: null
  },
  tabId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['saved', 'close'])

// Stores
const tabsStore = useTabsStore()

// Local state
const activeTab = ref('general')
const generalInfoRef = ref(null)
const confirmDialogVisible = ref(false)
const originalItemSnapshot = ref(null)

// Use the composable with refs
const {
  loading,
  saving,
  item,
  metadataLoading,
  formFields,
  fieldOptions,
  extendedFields,
  extendedFieldsLoading,
  availableTransitions,
  hasExtendedInfo,
  hasRelatedTickets,
  reverseLinkFields,
  getDisplayName,
  saveItem,
  applyTransition,
  init
} = useObjectView({
  objectType: toRef(props, 'objectType'),
  objectId: toRef(props, 'objectId'),
  mode: toRef(props, 'mode'),
  ciTypeUuid: toRef(props, 'ciTypeUuid'),
  ticketTypeCode: toRef(props, 'ticketTypeCode')
})

// Deep clone utility for snapshot
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (Array.isArray(obj)) return obj.map(deepClone)
  const cloned = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

// Deep compare utility
const deepEqual = (a, b) => {
  if (a === b) return true
  if (a === null || b === null) return a === b
  if (typeof a !== 'object' || typeof b !== 'object') return a === b
  if (Array.isArray(a) !== Array.isArray(b)) return false
  
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  
  if (keysA.length !== keysB.length) return false
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false
    if (!deepEqual(a[key], b[key])) return false
  }
  
  return true
}

// Computed: check if item has been modified
const isDirty = computed(() => {
  if (!item.value || !originalItemSnapshot.value) {
    // In create mode, consider dirty if any field has a value
    if (props.mode === 'create' && item.value) {
      const hasValue = Object.entries(item.value).some(([key, value]) => {
        if (key === '_translations' || key === 'extended_core_fields') return false
        return value !== null && value !== undefined && value !== '' && value !== false
      })
      return hasValue
    }
    return false
  }
  return !deepEqual(item.value, originalItemSnapshot.value)
})

// Take snapshot when item is loaded
const takeSnapshot = () => {
  if (item.value) {
    originalItemSnapshot.value = deepClone(item.value)
  }
}

// Reset dirty state after save
const resetDirtyState = () => {
  takeSnapshot()
}

// Methods
const onSave = async () => {
  const success = await saveItem(generalInfoRef, props.tabId)
  if (success) {
    resetDirtyState()
    emit('saved', item.value)
  }
}

const onCancel = () => {
  if (isDirty.value) {
    confirmDialogVisible.value = true
  } else {
    closeTab()
  }
}

const confirmClose = () => {
  confirmDialogVisible.value = false
  closeTab()
}

// Close the tab using the store
const closeTab = () => {
  if (props.tabId) {
    tabsStore.closeTab(props.tabId)
  }
  emit('close')
}

// Check if there are unsaved changes (exposed for parent)
const hasUnsavedChanges = () => isDirty.value

// Request close with confirmation if dirty
const requestClose = () => {
  if (isDirty.value) {
    confirmDialogVisible.value = true
    return false
  }
  return true
}

// Expose methods for parent component
defineExpose({
  hasUnsavedChanges,
  requestClose
})

// Watch for item changes to take initial snapshot
watch(() => loading.value, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading && item.value) {
    // Item just finished loading, take snapshot
    takeSnapshot()
  }
})

// Sync dirty state with tabsStore for tab-based views
watch(isDirty, (newDirty) => {
  if (props.tabId) {
    tabsStore.setTabDirty(props.tabId, newDirty)
  }
})

// Clean up dirty state when component is unmounted
onBeforeUnmount(() => {
  if (props.tabId) {
    tabsStore.setTabDirty(props.tabId, false)
  }
})

// Lifecycle
onMounted(async () => {
  await init()
  // Take snapshot after init for edit mode
  if (props.mode === 'edit' && item.value) {
    takeSnapshot()
  }
})
</script>
