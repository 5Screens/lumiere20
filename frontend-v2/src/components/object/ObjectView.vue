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
            :label="$t('common.cancel')" 
            icon="pi pi-times" 
            severity="secondary"
            text
            @click="onCancel"
          />
          <Button 
            :label="$t('common.save')" 
            icon="pi pi-check" 
            @click="onSave"
            :loading="saving"
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
  </div>
</template>

<script setup>
import { ref, toRef, onMounted } from 'vue'
import { useObjectView } from '@/composables/useObjectView'

// PrimeVue components
import Button from 'primevue/button'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'

// Custom components
import ObjectGeneralInfo from './ObjectGeneralInfo.vue'
import ObjectExtendedInfo from './ObjectExtendedInfo.vue'
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
  }
})

// Emits
const emit = defineEmits(['saved', 'close'])

// Local state
const activeTab = ref('general')
const generalInfoRef = ref(null)

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
  getDisplayName,
  saveItem,
  applyTransition,
  init
} = useObjectView({
  objectType: toRef(props, 'objectType'),
  objectId: toRef(props, 'objectId'),
  mode: toRef(props, 'mode')
})

// Methods
const onSave = async () => {
  const success = await saveItem(generalInfoRef)
  if (success) {
    emit('saved', item.value)
  }
}

const onCancel = () => {
  emit('close')
}

// Lifecycle
onMounted(async () => {
  await init()
})
</script>
