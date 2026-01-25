<template>
  <Drawer 
    v-model:visible="visible" 
    :header="$t('ocr.drawerTitle')"
    position="right"
    class="w-full md:w-[500px]"
    :modal="true"
  >
    <div class="flex flex-col h-full">
      <!-- Header description -->
      <div class="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div class="flex items-center gap-3 mb-2">
          <i class="pi pi-file-pdf text-2xl text-primary"></i>
          <h3 class="text-lg font-semibold text-surface-800 dark:text-surface-100">
            {{ $t('ocr.featureTitle') }}
          </h3>
        </div>
        <p class="text-sm text-surface-600 dark:text-surface-400">
          {{ $t('ocr.featureDescription') }}
        </p>
      </div>

      <!-- Drop zone -->
      <div 
        class="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer"
        :class="[
          isDragging 
            ? 'border-primary bg-primary/10' 
            : 'border-surface-300 dark:border-surface-600 hover:border-primary hover:bg-primary/5'
        ]"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
        @click="triggerFileInput"
      >
        <!-- Hidden file input -->
        <input 
          ref="fileInputRef"
          type="file"
          class="hidden"
          @change="onFileSelect"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.pptx,image/*,application/pdf"
        />

        <!-- Loading state -->
        <template v-if="isProcessing">
          <ProgressSpinner style="width: 50px; height: 50px" strokeWidth="4" />
          <p class="mt-4 text-surface-600 dark:text-surface-400">
            {{ $t('ocr.processingFile') }}
          </p>
          <p class="text-sm text-surface-500">{{ selectedFileName }}</p>
        </template>

        <!-- Default state -->
        <template v-else>
          <i class="pi pi-cloud-upload text-5xl text-surface-400 dark:text-surface-500 mb-4"></i>
          <p class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ $t('ocr.dropZoneTitle') }}
          </p>
          <p class="text-sm text-surface-500 mb-4">
            {{ $t('ocr.dropZoneSubtitle') }}
          </p>
          <Button 
            :label="$t('ocr.browseFiles')" 
            icon="pi pi-folder-open"
            outlined
            @click.stop="triggerFileInput"
          />
          <p class="mt-4 text-xs text-surface-400">
            {{ $t('ocr.supportedFormats') }}
          </p>
        </template>
      </div>

      <!-- Error message -->
      <Message v-if="errorMessage" severity="error" class="mt-4" :closable="true" @close="errorMessage = null">
        {{ errorMessage }}
      </Message>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import Drawer from 'primevue/drawer'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import { processOcr, saveOcrDocument } from '@/services/ocr'

const props = defineProps({
  show: { type: Boolean, default: false }
})

const emit = defineEmits(['update:show', 'ocr-complete'])

const { t } = useI18n()
const toast = useToast()

const visible = ref(false)
const fileInputRef = ref(null)
const isDragging = ref(false)
const isProcessing = ref(false)
const selectedFileName = ref('')
const errorMessage = ref(null)

// Sync visible with prop
watch(() => props.show, (newVal) => {
  visible.value = newVal
})

watch(visible, (newVal) => {
  emit('update:show', newVal)
  if (!newVal) {
    // Reset state when closing
    isDragging.value = false
    isProcessing.value = false
    selectedFileName.value = ''
    errorMessage.value = null
  }
})

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onDragOver = () => {
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (event) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files?.length > 0) {
    handleFile(files[0])
  }
}

const onFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    handleFile(file)
  }
  // Reset input for re-selection of same file
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleFile = async (file) => {
  // Validate file type
  const supportedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/gif',
    'image/avif',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]

  if (!supportedTypes.includes(file.type)) {
    errorMessage.value = t('ocr.unsupportedFormat')
    return
  }

  // Validate file size (max 20MB)
  const maxSize = 20 * 1024 * 1024
  if (file.size > maxSize) {
    errorMessage.value = t('ocr.fileTooLarge')
    return
  }

  errorMessage.value = null
  isProcessing.value = true
  selectedFileName.value = file.name

  try {
    // Step 1: Process OCR
    const ocrResult = await processOcr(file)
    
    if (!ocrResult?.markdown) {
      throw new Error(t('ocr.noContent'))
    }

    // Step 2: Save document to database
    const savedDocument = await saveOcrDocument({
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      markdown: ocrResult.markdown,
      pageCount: ocrResult.pageCount || 1
    })

    // Step 3: Show success toast
    toast.add({
      severity: 'success',
      summary: t('ocr.success'),
      detail: t('ocr.documentSaved'),
      life: 3000
    })

    // Step 4: Close drawer and emit event with document data
    visible.value = false
    emit('ocr-complete', {
      document: savedDocument,
      markdown: ocrResult.markdown,
      fileName: file.name,
      pageCount: ocrResult.pageCount || 1
    })

  } catch (error) {
    console.error('OCR error:', error)
    errorMessage.value = error.message || t('ocr.error')
    toast.add({
      severity: 'error',
      summary: t('ocr.error'),
      detail: error.message,
      life: 5000
    })
  } finally {
    isProcessing.value = false
  }
}
</script>
