<template>
  <div class="attachments-picker">
    <FileUpload 
      ref="fileUploadRef"
      name="files[]" 
      :url="uploadUrl"
      :multiple="true" 
      :maxFileSize="maxFileSize"
      :disabled="disabled"
      @upload="onUpload"
      @select="onSelect"
      @error="onError"
      customUpload
      @uploader="customUploader"
    >
      <template #header="{ chooseCallback, uploadCallback, clearCallback, files }">
        <div class="flex flex-wrap justify-between items-center flex-1 gap-4">
          <div class="flex gap-2">
            <Button @click="chooseCallback()" icon="pi pi-plus" rounded variant="outlined" severity="secondary" size="small" />
            <Button @click="uploadEvent(uploadCallback)" icon="pi pi-cloud-upload" rounded variant="outlined" severity="success" size="small" :disabled="!files || files.length === 0" />
            <Button @click="clearCallback()" icon="pi pi-times" rounded variant="outlined" severity="danger" size="small" :disabled="!files || files.length === 0" />
          </div>
          <ProgressBar v-if="uploading" :value="uploadProgress" :showValue="false" class="w-40 h-1" />
        </div>
      </template>

      <template #content="{ files, uploadedFiles, removeFileCallback }">
        <div class="flex flex-col gap-4 pt-4">
          <!-- Pending files -->
          <div v-if="files.length > 0">
            <h6 class="text-sm font-medium text-surface-500 mb-2">{{ $t('common.pending') }}</h6>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="(file, index) of files" 
                :key="file.name + file.type + file.size" 
                class="p-3 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center gap-3"
              >
                <i class="pi pi-file text-2xl text-surface-400" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate max-w-32">{{ file.name }}</div>
                  <div class="text-xs text-surface-400">{{ formatSize(file.size) }}</div>
                </div>
                <Button icon="pi pi-times" @click="removeFileCallback(index)" variant="text" rounded severity="danger" size="small" />
              </div>
            </div>
          </div>

          <!-- Existing attachments -->
          <div v-if="existingAttachments.length > 0">
            <h6 class="text-sm font-medium text-surface-500 mb-2">{{ $t('common.attachments') }}</h6>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="attachment of existingAttachments" 
                :key="attachment.uuid" 
                class="p-3 rounded-lg border border-surface-200 dark:border-surface-700 flex items-center gap-3 bg-surface-50 dark:bg-surface-800"
              >
                <i :class="getFileIcon(attachment.mime_type)" class="text-2xl" />
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-sm truncate max-w-32">{{ attachment.original_name }}</div>
                  <div class="text-xs text-surface-400">{{ formatSize(attachment.file_size) }}</div>
                </div>
                <Button icon="pi pi-download" @click="downloadAttachment(attachment)" variant="text" rounded severity="secondary" size="small" />
                <Button v-if="!disabled" icon="pi pi-trash" @click="deleteAttachment(attachment)" variant="text" rounded severity="danger" size="small" />
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="flex items-center justify-center flex-col py-6">
          <i class="pi pi-cloud-upload text-4xl text-surface-300 dark:text-surface-600" />
          <p class="mt-2 mb-0 text-sm text-surface-400">{{ $t('common.dragDropFiles') }}</p>
        </div>
      </template>
    </FileUpload>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import FileUpload from 'primevue/fileupload'
import Button from 'primevue/button'
import ProgressBar from 'primevue/progressbar'
import api from '@/services/api'

const { t } = useI18n()
const toast = useToast()

const props = defineProps({
  entityType: {
    type: String,
    required: true
  },
  entityUuid: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  maxFileSize: {
    type: Number,
    default: 10000000 // 10MB
  }
})

const emit = defineEmits(['update', 'error'])

const fileUploadRef = ref(null)
const existingAttachments = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)

const uploadUrl = computed(() => `/api/v1/attachments/${props.entityType}/${props.entityUuid}`)

// Load existing attachments
const loadAttachments = async () => {
  if (!props.entityUuid) return
  
  try {
    const response = await api.get(`/attachments/${props.entityType}/${props.entityUuid}`)
    existingAttachments.value = response.data || []
  } catch (error) {
    console.error('Failed to load attachments:', error)
  }
}

// Custom uploader for manual upload control
const customUploader = async (event) => {
  const files = event.files
  if (!files || files.length === 0) return

  uploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    const response = await api.post(
      `/attachments/${props.entityType}/${props.entityUuid}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    )

    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.filesUploaded'),
      life: 3000
    })

    // Reload attachments
    await loadAttachments()
    emit('update', existingAttachments.value)

    // Clear the file list
    if (fileUploadRef.value) {
      fileUploadRef.value.clear()
    }
  } catch (error) {
    console.error('Upload failed:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.uploadFailed'),
      life: 5000
    })
    emit('error', error)
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

const uploadEvent = (callback) => {
  callback()
}

const onUpload = () => {
  loadAttachments()
}

const onSelect = (event) => {
  // Files selected
}

const onError = (event) => {
  toast.add({
    severity: 'error',
    summary: t('common.error'),
    detail: event.error?.message || t('common.uploadFailed'),
    life: 5000
  })
}

const downloadAttachment = async (attachment) => {
  try {
    const response = await api.get(`/attachments/download/${attachment.uuid}`, {
      responseType: 'blob'
    })
    
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', attachment.original_name)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Download failed:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.downloadFailed'),
      life: 5000
    })
  }
}

const deleteAttachment = async (attachment) => {
  try {
    await api.delete(`/attachments/${attachment.uuid}`)
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.deleted'),
      life: 3000
    })
    
    await loadAttachments()
    emit('update', existingAttachments.value)
  } catch (error) {
    console.error('Delete failed:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.deleteFailed'),
      life: 5000
    })
  }
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFileIcon = (mimeType) => {
  if (!mimeType) return 'pi pi-file text-surface-400'
  if (mimeType.startsWith('image/')) return 'pi pi-image text-blue-500'
  if (mimeType.startsWith('video/')) return 'pi pi-video text-purple-500'
  if (mimeType.startsWith('audio/')) return 'pi pi-volume-up text-orange-500'
  if (mimeType.includes('pdf')) return 'pi pi-file-pdf text-red-500'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'pi pi-file-word text-blue-600'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'pi pi-file-excel text-green-600'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'pi pi-box text-yellow-600'
  return 'pi pi-file text-surface-400'
}

// Upload pending files programmatically (called from parent on save)
const uploadPendingFiles = async () => {
  if (!fileUploadRef.value) return false
  
  // Get pending files from FileUpload component
  const files = fileUploadRef.value.files
  if (!files || files.length === 0) return true // No pending files, success
  
  uploading.value = true
  uploadProgress.value = 0

  try {
    const formData = new FormData()
    for (const file of files) {
      formData.append('files', file)
    }

    await api.post(
      `/attachments/${props.entityType}/${props.entityUuid}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    )

    // Reload attachments
    await loadAttachments()
    emit('update', existingAttachments.value)

    // Clear the file list
    fileUploadRef.value.clear()
    return true
  } catch (error) {
    console.error('Upload failed:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.uploadFailed'),
      life: 5000
    })
    emit('error', error)
    return false
  } finally {
    uploading.value = false
    uploadProgress.value = 0
  }
}

// Check if there are pending files
const hasPendingFiles = () => {
  if (!fileUploadRef.value) return false
  const files = fileUploadRef.value.files
  return files && files.length > 0
}

// Expose methods for parent component
defineExpose({
  uploadPendingFiles,
  hasPendingFiles
})

onMounted(() => {
  if (props.entityUuid) {
    loadAttachments()
  }
})
</script>
