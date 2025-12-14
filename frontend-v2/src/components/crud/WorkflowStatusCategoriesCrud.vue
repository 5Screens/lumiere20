<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4" :pt="{ root: { class: 'p-2' } }">
        <template #start>
          <span class="text-lg font-semibold">{{ $t('workflow.statusCategories') }}</span>
        </template>
        <template #end>
          <Button 
            icon="pi pi-refresh" 
            severity="secondary" 
            text 
            @click="loadCategories" 
            :loading="loading"
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        :value="categories"
        :loading="loading"
        dataKey="uuid"
        scrollable
        scrollHeight="flex"
        stripedRows
        class="flex-1"
      >
        <Column field="code" :header="$t('ciCategories.code')" sortable style="width: 150px">
          <template #body="{ data }">
            <Tag :value="data.code" severity="secondary" />
          </template>
        </Column>
        
        <Column field="label" :header="$t('ciCategories.label')" sortable>
          <template #body="{ data }">
            {{ data.label }}
          </template>
        </Column>
        
        <Column field="color" header="Color" style="width: 120px">
          <template #body="{ data }">
            <div class="flex items-center gap-2">
              <span 
                class="w-6 h-6 rounded border border-surface-300" 
                :style="{ backgroundColor: data.color }"
              />
              <span class="text-sm text-surface-500">{{ data.color }}</span>
            </div>
          </template>
        </Column>
        
        <Column field="display_order" :header="$t('ciCategories.displayOrder')" sortable style="width: 100px">
          <template #body="{ data }">
            {{ data.display_order }}
          </template>
        </Column>
        
        <Column field="is_active" :header="$t('common.isActive')" sortable style="width: 80px">
          <template #body="{ data }">
            <i :class="data.is_active ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
          </template>
        </Column>
        
        <Column :header="$t('common.actions')" style="width: 100px">
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              text 
              size="small" 
              @click="editCategory(data)" 
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Edit Dialog -->
    <Dialog 
      v-model:visible="showEditDialog" 
      :header="$t('common.edit')" 
      modal 
      :style="{ width: '500px' }"
    >
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('ciCategories.code') }}</label>
        <InputText v-model="editForm.code" class="w-full" disabled />
      </div>
      
      <div class="field mb-4">
        <label class="block mb-1 font-medium">Color</label>
        <div class="flex items-center gap-2">
          <ColorPicker v-model="editForm.color" />
          <InputText v-model="editForm.color" class="flex-1" />
        </div>
      </div>
      
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('ciCategories.displayOrder') }}</label>
        <InputNumber v-model="editForm.display_order" class="w-full" />
      </div>
      
      <div class="field mb-4">
        <label class="block mb-1 font-medium">{{ $t('common.isActive') }}</label>
        <ToggleSwitch v-model="editForm.is_active" />
      </div>
      
      <!-- Translations -->
      <div class="field mb-4">
        <label class="block mb-2 font-medium">{{ $t('common.translate') }}</label>
        <div class="space-y-2">
          <div v-for="lang in activeLanguages" :key="lang.code" class="flex items-center gap-2">
            <span class="w-8">{{ lang.flag_code }}</span>
            <InputText 
              v-model="editForm._translations.label[lang.code]" 
              :placeholder="lang.name"
              class="flex-1" 
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button :label="$t('common.cancel')" text @click="showEditDialog = false" />
        <Button :label="$t('common.save')" @click="saveCategory" :loading="saving" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import api from '@/services/api'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Toolbar from 'primevue/toolbar'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import ColorPicker from 'primevue/colorpicker'
import ToggleSwitch from 'primevue/toggleswitch'

const { t, locale } = useI18n()
const toast = useToast()

const categories = ref([])
const loading = ref(false)
const showEditDialog = ref(false)
const saving = ref(false)
const activeLanguages = ref([])

const editForm = ref({
  uuid: '',
  code: '',
  color: '',
  display_order: 0,
  is_active: true,
  _translations: { label: {} }
})

const loadCategories = async () => {
  loading.value = true
  try {
    const response = await api.get(`/workflow-status-categories?locale=${locale.value}&active=false`)
    categories.value = response.data
  } catch (error) {
    console.error('Error loading categories:', error)
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  } finally {
    loading.value = false
  }
}

const loadLanguages = async () => {
  try {
    const response = await api.get('/languages?active=true')
    activeLanguages.value = response.data
  } catch (error) {
    console.error('Error loading languages:', error)
  }
}

const editCategory = (category) => {
  editForm.value = {
    uuid: category.uuid,
    code: category.code,
    color: category.color?.replace('#', '') || '6b7280',
    display_order: category.display_order,
    is_active: category.is_active,
    _translations: {
      label: { ...category._translations?.label } || {}
    }
  }
  showEditDialog.value = true
}

const saveCategory = async () => {
  saving.value = true
  try {
    const payload = {
      color: editForm.value.color.startsWith('#') ? editForm.value.color : `#${editForm.value.color}`,
      display_order: editForm.value.display_order,
      is_active: editForm.value.is_active,
      _translations: editForm.value._translations
    }
    
    await api.put(`/workflow-status-categories/${editForm.value.uuid}`, payload)
    
    showEditDialog.value = false
    await loadCategories()
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
  } catch (error) {
    console.error('Error saving category:', error)
    toast.add({ severity: 'error', summary: t('common.error'), life: 3000 })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCategories()
  loadLanguages()
})
</script>
