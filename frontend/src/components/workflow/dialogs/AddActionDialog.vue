<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="$t('workflow.actions.addAction')"
    modal
    :style="{ width: '600px' }"
    @hide="resetForm"
  >
    <!-- Step 1: Choose action type -->
    <div v-if="step === 'type'">
      <p class="text-sm text-surface-500 mb-4">{{ $t('workflow.actions.selectActionType') }}</p>

      <div class="space-y-2">
        <div
          v-for="category in actionCategories"
          :key="category.key"
          class="mb-4"
        >
          <div class="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider mb-2">
            {{ $t(`workflow.actions.categories.${category.key}`) }}
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div
              v-for="actionType in category.types"
              :key="actionType.value"
              class="action-type-card flex items-center gap-3 p-3 rounded-lg border border-surface-200 dark:border-surface-600 hover:border-primary-400 dark:hover:border-primary-500 cursor-pointer transition-all"
              :class="{ 'border-primary-500 bg-primary-50 dark:bg-primary-900/20': selectedType === actionType.value }"
              @click="selectType(actionType.value)"
            >
              <span
                class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-shrink-0"
                :style="{ background: actionType.color }"
              >
                <i :class="actionType.icon" />
              </span>
              <div class="min-w-0">
                <div class="text-sm font-medium truncate">{{ $t(`workflow.actions.types.${actionType.value}`) }}</div>
                <div class="text-xs text-surface-400 dark:text-surface-500 truncate">{{ $t(`workflow.actions.descriptions.${actionType.value}`) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Configure action -->
    <div v-if="step === 'config'">
      <div class="flex items-center gap-2 mb-4">
        <Button icon="pi pi-arrow-left" text size="small" @click="step = 'type'" />
        <span
          class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
          :style="{ background: getActionColor(selectedType) }"
        >
          <i :class="getActionIcon(selectedType)" />
        </span>
        <div>
          <div class="font-medium">{{ $t(`workflow.actions.types.${selectedType}`) }}</div>
          <div class="text-xs text-surface-400">{{ $t(`workflow.actions.descriptions.${selectedType}`) }}</div>
        </div>
      </div>

      <!-- Label -->
      <div class="field mb-4">
        <label class="text-sm font-medium block mb-1">{{ $t('workflow.actions.label') }}</label>
        <InputText
          v-model="actionLabel"
          class="w-full"
          :placeholder="$t(`workflow.actions.types.${selectedType}`)"
        />
        <small class="text-surface-400">{{ $t('workflow.actions.labelHint') }}</small>
      </div>

      <!-- Action-specific config fields -->
      <component
        :is="configComponent"
        v-if="configComponent"
        v-model="actionConfig"
      />
    </div>

    <template #footer>
      <Button :label="$t('common.cancel')" text @click="dialogVisible = false" />
      <Button
        v-if="step === 'type'"
        :label="$t('common.next')"
        icon="pi pi-arrow-right"
        iconPos="right"
        @click="step = 'config'"
        :disabled="!selectedType"
      />
      <Button
        v-if="step === 'config'"
        :label="$t('common.add')"
        icon="pi pi-check"
        @click="submit"
      />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'

const props = defineProps({
  visible: Boolean,
  ownerUuid: String,
  trigger: String
})

const emit = defineEmits(['update:visible', 'add'])
const { t } = useI18n()

const step = ref('type')
const selectedType = ref(null)
const actionLabel = ref('')
const actionConfig = ref({})

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const ACTION_META = {
  look_up_record:    { icon: 'pi pi-search',             color: '#6366f1' },
  create_record:     { icon: 'pi pi-plus-circle',        color: '#22c55e' },
  update_record:     { icon: 'pi pi-pencil',             color: '#f59e0b' },
  delete_record:     { icon: 'pi pi-trash',              color: '#ef4444' },
  log:               { icon: 'pi pi-file',               color: '#6b7280' },
  ask_for_approval:  { icon: 'pi pi-check-circle',       color: '#8b5cf6' },
  wait_for_condition:{ icon: 'pi pi-clock',              color: '#f97316' },
  wait_for_duration: { icon: 'pi pi-hourglass',          color: '#f97316' },
  if_condition:      { icon: 'pi pi-question-circle',    color: '#0ea5e9' },
  for_each:          { icon: 'pi pi-replay',             color: '#0ea5e9' },
  parallel:          { icon: 'pi pi-arrows-h',           color: '#0ea5e9' },
  assign_values:     { icon: 'pi pi-equals',             color: '#14b8a6' },
  send_email:        { icon: 'pi pi-envelope',           color: '#ec4899' },
  send_notification: { icon: 'pi pi-bell',               color: '#ec4899' },
  rest_step:         { icon: 'pi pi-globe',              color: '#64748b' }
}

const actionCategories = computed(() => [
  {
    key: 'data',
    types: [
      { value: 'look_up_record', ...ACTION_META.look_up_record },
      { value: 'create_record', ...ACTION_META.create_record },
      { value: 'update_record', ...ACTION_META.update_record },
      { value: 'delete_record', ...ACTION_META.delete_record }
    ]
  },
  {
    key: 'approval',
    types: [
      { value: 'ask_for_approval', ...ACTION_META.ask_for_approval }
    ]
  },
  {
    key: 'wait',
    types: [
      { value: 'wait_for_condition', ...ACTION_META.wait_for_condition },
      { value: 'wait_for_duration', ...ACTION_META.wait_for_duration }
    ]
  },
  {
    key: 'logic',
    types: [
      { value: 'if_condition', ...ACTION_META.if_condition },
      { value: 'for_each', ...ACTION_META.for_each },
      { value: 'parallel', ...ACTION_META.parallel },
      { value: 'assign_values', ...ACTION_META.assign_values }
    ]
  },
  {
    key: 'notification',
    types: [
      { value: 'send_email', ...ACTION_META.send_email },
      { value: 'send_notification', ...ACTION_META.send_notification }
    ]
  },
  {
    key: 'integration',
    types: [
      { value: 'rest_step', ...ACTION_META.rest_step }
    ]
  },
  {
    key: 'system',
    types: [
      { value: 'log', ...ACTION_META.log }
    ]
  }
])

// Config component placeholder (will be extended per action type later)
const configComponent = shallowRef(null)

const getActionIcon = (type) => ACTION_META[type]?.icon || 'pi pi-cog'
const getActionColor = (type) => ACTION_META[type]?.color || '#6b7280'

const selectType = (type) => {
  selectedType.value = type
}

const resetForm = () => {
  step.value = 'type'
  selectedType.value = null
  actionLabel.value = ''
  actionConfig.value = {}
}

const submit = () => {
  emit('add', {
    action_type: selectedType.value,
    label: actionLabel.value || null,
    config: actionConfig.value,
    trigger: props.trigger,
    rel_status_uuid: props.trigger === 'on_enter' || props.trigger === 'on_exit' ? props.ownerUuid : null,
    rel_transition_uuid: props.trigger === 'on_transition' ? props.ownerUuid : null
  })
  dialogVisible.value = false
}
</script>

<style scoped>
.action-type-card {
  transition: all 0.15s ease;
}
.action-type-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>
