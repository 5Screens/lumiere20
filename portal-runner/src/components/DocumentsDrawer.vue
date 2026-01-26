<template>
  <Drawer 
    v-model:visible="visible" 
    :header="$t('documents.drawerTitle')"
    position="right"
    class="w-full md:w-[600px]"
    :modal="true"
  >
    <div class="flex flex-col h-full">
      <!-- Loading state -->
      <div v-if="loading" class="flex-1 flex items-center justify-center">
        <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
      </div>

      <!-- Empty state -->
      <div v-else-if="documents.length === 0" class="flex-1 flex flex-col items-center justify-center text-center p-8">
        <i class="pi pi-file-pdf text-5xl text-surface-300 dark:text-surface-600 mb-4"></i>
        <p class="text-lg font-medium text-surface-600 dark:text-surface-400 mb-2">
          {{ $t('documents.noDocuments') }}
        </p>
        <p class="text-sm text-surface-500">
          {{ $t('documents.noDocumentsHint') }}
        </p>
      </div>

      <!-- Documents list -->
      <div v-else class="flex-1 overflow-y-auto">
        <DataTable 
          :value="documents" 
          :paginator="documents.length > 10"
          :rows="10"
          dataKey="uuid"
          class="p-datatable-sm"
          @row-click="onRowClick"
          :rowHover="true"
          selectionMode="single"
        >
          <Column field="original_name" :header="$t('documents.fileName')" sortable>
            <template #body="{ data }">
              <div class="flex items-center gap-2">
                <i class="pi pi-file-pdf text-primary"></i>
                <span class="font-medium">{{ data.original_name }}</span>
              </div>
            </template>
          </Column>
          <Column field="created_at" :header="$t('documents.date')" sortable style="width: 150px">
            <template #body="{ data }">
              <span class="text-sm text-surface-500">
                {{ formatDate(data.created_at) }}
              </span>
            </template>
          </Column>
          <Column style="width: 80px">
            <template #body="{ data }">
              <div class="flex items-center gap-1">
                <Button 
                  icon="pi pi-eye" 
                  text 
                  rounded 
                  size="small"
                  @click.stop="viewDocument(data)"
                  v-tooltip.top="$t('documents.view')"
                />
                <Button 
                  icon="pi pi-trash" 
                  text 
                  rounded 
                  size="small"
                  severity="danger"
                  @click.stop="confirmDelete(data)"
                  v-tooltip.top="$t('documents.delete')"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Document detail dialog -->
    <Dialog 
      v-model:visible="showDetailDialog" 
      :header="selectedDocument?.original_name"
      :modal="true"
      :style="{ width: '80vw', maxWidth: '900px' }"
      :maximizable="true"
    >
      <div v-if="loadingDetail" class="flex items-center justify-center py-8">
        <ProgressSpinner style="width: 40px; height: 40px" strokeWidth="4" />
      </div>
      <div v-else class="markdown-content prose dark:prose-invert max-w-none" v-html="renderedMarkdown"></div>
    </Dialog>

    <!-- Delete confirmation dialog -->
    <Dialog 
      v-model:visible="showDeleteDialog" 
      :header="$t('documents.confirmDeleteTitle')"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500"></i>
        <span>{{ $t('documents.confirmDeleteMessage', { name: documentToDelete?.original_name }) }}</span>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" text @click="cancelDelete" />
        <Button :label="$t('documents.delete')" severity="danger" @click="executeDelete" />
      </template>
    </Dialog>
  </Drawer>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Drawer from 'primevue/drawer'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { getOcrDocuments, getOcrDocument, deleteOcrDocument } from '@/services/ocr'
import { marked } from 'marked'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['update:show'])

const { t, locale } = useI18n()
const toast = useToast()

const visible = ref(false)
const loading = ref(false)
const documents = ref([])
const showDetailDialog = ref(false)
const selectedDocument = ref(null)
const loadingDetail = ref(false)
const documentMarkdown = ref('')

const renderedMarkdown = computed(() => {
  if (!documentMarkdown.value) return ''
  return marked.parse(documentMarkdown.value)
})

// Sync visible with prop
watch(() => props.show, async (newVal) => {
  visible.value = newVal
  if (newVal) {
    await loadDocuments()
  }
})

watch(visible, (newVal) => {
  emit('update:show', newVal)
})

const loadDocuments = async () => {
  loading.value = true
  try {
    documents.value = await getOcrDocuments()
  } catch (error) {
    console.error('Failed to load documents:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.message,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString(locale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const onRowClick = (event) => {
  viewDocument(event.data)
}

const viewDocument = async (doc) => {
  selectedDocument.value = doc
  showDetailDialog.value = true
  loadingDetail.value = true
  documentMarkdown.value = ''

  try {
    const fullDoc = await getOcrDocument(doc.uuid)
    documentMarkdown.value = fullDoc.markdown || fullDoc.file_path || ''
  } catch (error) {
    console.error('Failed to load document:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.message,
      life: 5000
    })
  } finally {
    loadingDetail.value = false
  }
}

// Delete confirmation state
const showDeleteDialog = ref(false)
const documentToDelete = ref(null)

const confirmDelete = (doc) => {
  documentToDelete.value = doc
  showDeleteDialog.value = true
}

const cancelDelete = () => {
  showDeleteDialog.value = false
  documentToDelete.value = null
}

const executeDelete = async () => {
  if (documentToDelete.value) {
    await deleteDocument(documentToDelete.value)
  }
  showDeleteDialog.value = false
  documentToDelete.value = null
}

const deleteDocument = async (doc) => {
  try {
    await deleteOcrDocument(doc.uuid)
    documents.value = documents.value.filter(d => d.uuid !== doc.uuid)
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('documents.deleted'),
      life: 3000
    })
  } catch (error) {
    console.error('Failed to delete document:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.message,
      life: 5000
    })
  }
}

// Expose refresh method
defineExpose({
  refresh: loadDocuments
})
</script>

<style scoped>
.markdown-content {
  line-height: 1.6;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3) {
  margin-top: 1em;
  margin-bottom: 0.5em;
}

:deep(.markdown-content p) {
  margin-bottom: 0.75em;
}

:deep(.markdown-content ul),
:deep(.markdown-content ol) {
  margin-left: 1.5em;
  margin-bottom: 0.75em;
}

:deep(.markdown-content table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1em;
}

:deep(.markdown-content th),
:deep(.markdown-content td) {
  border: 1px solid var(--p-surface-300);
  padding: 0.5em;
}

:deep(.markdown-content th) {
  background: var(--p-surface-100);
}
</style>
