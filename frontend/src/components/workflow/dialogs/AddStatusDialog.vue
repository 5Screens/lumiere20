<template>
  <Dialog 
    v-model:visible="dialogVisible" 
    :header="$t('workflow.addStatus')" 
    modal 
    :style="{ width: '450px' }"
    @hide="resetForm"
  >
    <p class="text-sm text-surface-500 mb-4">{{ $t('workflow.addStatusDescription') }}</p>
    
    <!-- Name -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('workflow.newStatusName') }}</label>
      <InputText 
        v-model="name" 
        class="w-full" 
        :class="{ 'p-invalid': nameError }"
        :maxlength="60"
        @input="validateName"
      />
      <small v-if="nameError" class="text-red-500">{{ nameError }}</small>
    </div>
    
    <!-- Category -->
    <div class="field mb-4">
      <label class="text-sm font-medium block mb-1">{{ $t('workflow.statusCategory') }}</label>
      <Select 
        v-model="categoryUuid" 
        :options="categories" 
        optionLabel="label" 
        optionValue="uuid"
        :placeholder="$t('workflow.selectCategory')"
        class="w-full"
        :class="{ 'p-invalid': !categoryUuid && submitted }"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded" :style="{ background: option.color }" />
            <span>{{ option.label }}</span>
          </div>
        </template>
        <template #value="{ value }">
          <div v-if="value" class="flex items-center gap-2">
            <span class="w-4 h-4 rounded" :style="{ background: getCategory(value)?.color }" />
            <span>{{ getCategory(value)?.label }}</span>
          </div>
          <span v-else>{{ $t('workflow.selectCategory') }}</span>
        </template>
      </Select>
    </div>
    
    <template #footer>
      <Button :label="$t('common.cancel')" text @click="dialogVisible = false" />
      <Button :label="$t('common.add')" @click="submit" :disabled="!isValid" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'

const props = defineProps({
  visible: Boolean,
  categories: Array
})

const emit = defineEmits(['update:visible', 'add'])
const { t } = useI18n()

const name = ref('')
const categoryUuid = ref('')
const nameError = ref('')
const submitted = ref(false)

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const isValid = computed(() => {
  return name.value.trim() && categoryUuid.value && !nameError.value
})

const getCategory = (uuid) => props.categories?.find(c => c.uuid === uuid)

const validateName = () => {
  if (name.value.length > 60) {
    nameError.value = t('workflow.statusNameTooLong')
  } else {
    nameError.value = ''
  }
}

const resetForm = () => {
  name.value = ''
  categoryUuid.value = ''
  nameError.value = ''
  submitted.value = false
}

const submit = () => {
  submitted.value = true
  if (!isValid.value) return
  
  emit('add', {
    name: name.value.trim(),
    rel_category_uuid: categoryUuid.value,
    allow_all_inbound: true
  })
}
</script>
