<template>
  <div class="status-panel p-4 text-surface-900 dark:text-surface-0">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">{{ $t('workflow.status') }}</h3>
    </div>
    
    <Tabs :value="activeTab" @update:value="activeTab = $event">
      <TabList>
        <Tab value="general">{{ $t('workflow.actions.tabGeneral') }}</Tab>
        <Tab value="on_enter">
          {{ $t('workflow.actions.tabOnEnter') }}
          <Badge v-if="onEnterCount > 0" :value="onEnterCount" severity="info" class="ml-1" />
        </Tab>
        <Tab value="on_exit">
          {{ $t('workflow.actions.tabOnExit') }}
          <Badge v-if="onExitCount > 0" :value="onExitCount" severity="info" class="ml-1" />
        </Tab>
      </TabList>

      <TabPanels>
        <!-- General tab -->
        <TabPanel value="general">
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-4">{{ $t('workflow.statusDescription') }}</p>
    
          <!-- Name -->
          <div class="field mb-4">
            <label class="text-sm font-medium block mb-1">{{ $t('workflow.name') }}</label>
            <TranslatableInput
              v-model="localName"
              :translations="status?._translations?.name || {}"
              :field-label="$t('workflow.name')"
              class="w-full"
              @update:translations="saveNameTranslations"
            />
          </div>
    
          <!-- Initial Status -->
          <div class="field mb-4">
            <div class="flex items-center gap-2">
              <Checkbox v-model="localIsInitial" binary @change="saveIsInitial" />
              <span class="text-sm">{{ $t('workflow.initialStatus') }}</span>
            </div>
          </div>
    
          <!-- Category -->
          <div class="field mb-4">
            <div class="flex items-center justify-between mb-1">
              <label class="text-sm font-medium">{{ $t('workflow.category') }}</label>
              <Button icon="pi pi-pencil" text size="small" @click="editCategory = true" />
            </div>
            <div v-if="!editCategory" class="flex items-center gap-2">
              <span class="w-4 h-4 rounded" :style="{ background: status?.category?.color }" />
              <span>{{ status?.category?.label }}</span>
            </div>
            <Select v-else v-model="localCategory" :options="categories" optionLabel="label" optionValue="uuid" class="w-full" @change="saveCategory" />
          </div>
    
          <!-- Transitions -->
          <div class="field mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium">{{ $t('workflow.transitions') }}</label>
              <Button icon="pi pi-plus" text size="small" @click="$emit('add-transition')" />
            </div>
      
            <div class="flex items-center gap-2 mb-3">
              <Checkbox v-model="localAllowAllInbound" binary @change="saveAllowAllInbound" />
              <span class="text-sm">{{ $t('workflow.allowAllInbound') }}</span>
            </div>
      
            <div class="space-y-2">
              <div v-for="tr in transitions" :key="tr.uuid" class="p-2 bg-surface-100 dark:bg-surface-700 rounded">
                <div class="font-medium text-sm mb-1">{{ tr.name }}</div>
                <div class="flex flex-wrap gap-1">
                  <Tag v-for="s in tr.sources" :key="s.uuid" :value="s.from_status.name" size="small" />
                  <i class="pi pi-arrow-right text-xs mx-1" />
                  <Tag :value="tr.to_status.name" severity="success" size="small" />
                </div>
              </div>
            </div>
          </div>
    
          <!-- Delete -->
          <Button :label="$t('workflow.deleteStatus')" icon="pi pi-trash" severity="danger" outlined class="w-full" @click="confirmDelete" />
        </TabPanel>

        <!-- On Enter tab -->
        <TabPanel value="on_enter">
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-3">{{ $t('workflow.actions.onEnterDescription') }}</p>
          <ActionsList
            :title="$t('workflow.actions.tabOnEnter')"
            :actions="status?.on_enter_actions || []"
            @add="showAddActionDialog('on_enter')"
            @edit="(a) => $emit('edit-action', a)"
            @delete="(uuid) => $emit('delete-action', uuid)"
            @toggle-active="(uuid, val) => $emit('toggle-action-active', uuid, val)"
          />
        </TabPanel>

        <!-- On Exit tab -->
        <TabPanel value="on_exit">
          <p class="text-sm text-surface-500 dark:text-surface-400 mb-3">{{ $t('workflow.actions.onExitDescription') }}</p>
          <ActionsList
            :title="$t('workflow.actions.tabOnExit')"
            :actions="status?.on_exit_actions || []"
            @add="showAddActionDialog('on_exit')"
            @edit="(a) => $emit('edit-action', a)"
            @delete="(uuid) => $emit('delete-action', uuid)"
            @toggle-active="(uuid, val) => $emit('toggle-action-active', uuid, val)"
          />
        </TabPanel>
      </TabPanels>
    </Tabs>

    <!-- Add Action Dialog -->
    <AddActionDialog
      v-model:visible="addActionVisible"
      :owner-uuid="status?.uuid"
      :trigger="addActionTrigger"
      @add="(data) => $emit('add-action', data)"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useI18n } from 'vue-i18n'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import Checkbox from 'primevue/checkbox'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import TranslatableInput from '@/components/form/TranslatableInput.vue'
import ActionsList from './ActionsList.vue'
import AddActionDialog from '../dialogs/AddActionDialog.vue'

const props = defineProps({
  status: Object,
  categories: Array,
  transitions: Array
})

const emit = defineEmits(['update', 'delete', 'add-transition', 'add-action', 'edit-action', 'delete-action', 'toggle-action-active'])
const confirm = useConfirm()
const { t } = useI18n()

const activeTab = ref('general')
const editCategory = ref(false)
const localName = ref('')
const localNameTranslations = ref({})
const localCategory = ref('')
const localAllowAllInbound = ref(false)
const localIsInitial = ref(false)

const addActionVisible = ref(false)
const addActionTrigger = ref('on_enter')

const onEnterCount = computed(() => (props.status?.on_enter_actions || []).length)
const onExitCount = computed(() => (props.status?.on_exit_actions || []).length)

const showAddActionDialog = (trigger) => {
  addActionTrigger.value = trigger
  addActionVisible.value = true
}

watch(() => props.status, (s) => {
  if (s) {
    localName.value = s.name
    localNameTranslations.value = s._translations?.name || {}
    localCategory.value = s.rel_category_uuid
    localAllowAllInbound.value = s.allow_all_inbound
    localIsInitial.value = s.is_initial || false
  }
}, { immediate: true })

const saveNameTranslations = (translations) => {
  localNameTranslations.value = translations
  emit('update', { 
    ...props.status, 
    name: localName.value,
    _translations: { 
      ...props.status?._translations,
      name: translations 
    }
  })
}

const saveCategory = () => {
  editCategory.value = false
  emit('update', { ...props.status, rel_category_uuid: localCategory.value })
}

const saveAllowAllInbound = () => {
  emit('update', { ...props.status, allow_all_inbound: localAllowAllInbound.value })
}

const saveIsInitial = () => {
  emit('update', { ...props.status, is_initial: localIsInitial.value })
}

const confirmDelete = () => {
  confirm.require({
    message: t('workflow.confirmDeleteStatus'),
    header: t('common.confirm'),
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => emit('delete', props.status?.uuid)
  })
}
</script>
