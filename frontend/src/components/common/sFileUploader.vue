<template>
  <div class="s-file-uploader" :class="{ 'has-error': showError }">
    <!-- Label du composant -->
    <div class="s-file-uploader__label-container" v-if="label">
      <label class="s-file-uploader__label" :class="{ 's-file-uploader__label--required': required }">
        {{ label }}
      </label>
    </div>

    <!-- Texte d'aide -->
    <div class="s-file-uploader__helper-text" v-if="helperText">
      {{ helperText }}
    </div>

    <!-- Zone de drag & drop -->
    <div
      class="s-file-uploader__dropzone"
      :class="{ 'is-dragging': isDragging, 'has-error': showError }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <div class="s-file-uploader__placeholder" v-if="!files.length">
        {{ placeholder || t('fileUploader.dropzone_placeholder') }}
      </div>
      <button class="s-file-uploader__browse-button">
        {{ t('fileUploader.browse_button') }}
      </button>
      <input
        ref="fileInput"
        type="file"
        class="s-file-uploader__file-input"
        @change="handleFileSelect"
        multiple
      />
    </div>

    <!-- Message d'erreur -->
    <div class="s-file-uploader__error" v-if="showError">
      {{ t('fileUploader.required_error') }}
    </div>

    <!-- Liste des fichiers -->
    <div class="s-file-uploader__file-list" v-if="files.length">
      <div
        v-for="(file, index) in files"
        :key="file.uuid || index"
        class="s-file-uploader__file-item"
      >
        <!-- Icône du fichier -->
        <div class="s-file-uploader__file-icon">
          <i :class="getFileIconClass(file.mimetype || file.type)"></i>
        </div>

        <!-- Informations du fichier -->
        <div class="s-file-uploader__file-info">
          <div class="s-file-uploader__file-name">{{ file.originalname || file.name }}</div>
          <div class="s-file-uploader__file-size">{{ formatFileSize(file.size) }}</div>
        </div>

        <!-- Actions sur le fichier -->
        <div class="s-file-uploader__file-actions">
          <!-- Bouton de prévisualisation (pour PDF et images) -->
          <button
            v-if="canPreview(file)"
            class="s-file-uploader__action-button preview"
            @click.stop="previewFile(file)"
            :title="t('fileUploader.preview')"
          >
            <i class="fas fa-eye"></i>
          </button>

          <!-- Bouton de suppression -->
          <button
            class="s-file-uploader__action-button delete"
            @click.stop="removeFile(file, index)"
            :title="t('fileUploader.delete')"
          >
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de prévisualisation -->
    <div v-if="showPreview" class="s-file-uploader__preview-modal" @click="closePreview">
      <div class="s-file-uploader__preview-content" @click.stop>
        <div class="s-file-uploader__preview-header">
          <div class="s-file-uploader__preview-title">
            {{ previewFile?.originalname || previewFile?.name }}
          </div>
          <button class="s-file-uploader__preview-close" @click="closePreview">&times;</button>
        </div>
        <div class="s-file-uploader__preview-body">
          <!-- Prévisualisation d'image -->
          <img
            v-if="isImage(previewFile)"
            :src="getPreviewUrl(previewFile)"
            class="s-file-uploader__preview-image"
            alt="Preview"
          />
          <!-- Prévisualisation de PDF -->
          <iframe
            v-else-if="isPdf(previewFile)"
            :src="getPreviewUrl(previewFile)"
            class="s-file-uploader__preview-iframe"
            title="PDF Preview"
          ></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { API_BASE_URL } from '@/config/config'
import apiService from '@/services/apiService'
import '@/assets/styles/sFileUploader.css'

// Props du composant
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  uuid: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  helperText: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  edition: {
    type: Boolean,
    default: false
  },
  fieldName: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  }
})

// Émissions d'événements
const emit = defineEmits(['update:modelValue', 'error'])

// Composables
const { t } = useI18n()

// État réactif
const fileInput = ref(null)
const files = ref([])
const isDragging = ref(false)
const showPreview = ref(false)
const previewFile = ref(null)
const isUploading = ref(false)
const uploadErrors = ref([])

// Types de fichiers interdits
const FORBIDDEN_MIME_TYPES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/javascript',
  'application/x-php',
  'text/x-php'
]

// Taille maximale de fichier (10 Mo)
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Propriétés calculées
const showError = computed(() => {
  return props.required && files.value.length === 0
})

// Surveiller les changements de modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue && Array.isArray(newValue)) {
    files.value = [...newValue]
  }
}, { deep: true })

// Surveiller les changements de files
watch(files, (newFiles) => {
  emit('update:modelValue', newFiles)
}, { deep: true })

// Méthodes
const triggerFileInput = () => {
  fileInput.value.click()
}

const handleDragOver = (event) => {
  isDragging.value = true
}

const handleDragLeave = (event) => {
  isDragging.value = false
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFiles = event.dataTransfer.files
  if (droppedFiles.length) {
    processFiles(droppedFiles)
  }
}

const handleFileSelect = (event) => {
  const selectedFiles = event.target.files
  if (selectedFiles.length) {
    processFiles(selectedFiles)
    // Réinitialiser l'input file pour permettre de sélectionner à nouveau le même fichier
    event.target.value = null
  }
}

const processFiles = async (fileList) => {
  const newFiles = Array.from(fileList)
  const validFiles = []
  const errors = []

  // Valider chaque fichier
  for (const file of newFiles) {
    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: ${t('fileUploader.file_too_large')}`)
      continue
    }

    // Vérifier le type MIME
    if (FORBIDDEN_MIME_TYPES.includes(file.type)) {
      errors.push(`${file.name}: ${t('fileUploader.forbidden_file_type')}`)
      continue
    }

    validFiles.push(file)
  }

  // Mettre à jour les erreurs
  uploadErrors.value = errors
  if (errors.length) {
    emit('error', errors)
  }

  // Si en mode édition, uploader les fichiers immédiatement
  if (props.edition && props.uuid && validFiles.length) {
    await uploadFiles(validFiles)
  } else {
    // Sinon, ajouter les fichiers à la liste
    files.value = [...files.value, ...validFiles]
  }
}

const uploadFiles = async (filesToUpload) => {
  if (!props.uuid) {
    console.error('UUID is required for file upload in edition mode')
    return
  }

  isUploading.value = true
  const uploadedFiles = []
  const errors = []

  try {
    // Uploader plusieurs fichiers
    if (filesToUpload.length > 1) {
      const formData = new FormData()
      filesToUpload.forEach(file => {
        formData.append('files', file)
      })
      formData.append('objectType', props.fieldName.toUpperCase())
      formData.append('objectUuid', props.uuid)

      // Utiliser apiService pour l'upload avec FormData
      const response = await apiService.uploadFormData('attachments/upload-multiple', formData)
      
      if (response && response.attachments) {
        uploadedFiles.push(...response.attachments)
      }
    } 
    // Uploader un seul fichier
    else if (filesToUpload.length === 1) {
      const file = filesToUpload[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('objectType', props.fieldName.toUpperCase())
      formData.append('objectUuid', props.uuid)

      // Utiliser apiService pour l'upload avec FormData
      const response = await apiService.uploadFormData('attachments/upload', formData)
      
      if (response && response.attachment) {
        uploadedFiles.push(response.attachment)
      }
    }

    // Mettre à jour la liste des fichiers
    files.value = [...files.value, ...uploadedFiles]
  } catch (error) {
    console.error('Error uploading files:', error)
    errors.push(error.message || 'Upload failed')
    emit('error', errors)
  } finally {
    isUploading.value = false
  }
}



const removeFile = async (file, index) => {
  // Si en mode édition et le fichier a un UUID, le supprimer du serveur
  if (props.edition && file.uuid) {
    try {
      await apiService.delete(`attachments/${file.uuid}`)
      files.value = files.value.filter(f => f.uuid !== file.uuid)
    } catch (error) {
      console.error('Error deleting file:', error)
      emit('error', [error.message || 'Delete failed'])
    }
  } else {
    // Sinon, simplement le retirer de la liste
    files.value.splice(index, 1)
  }
}

const previewFile = (file) => {
  previewFile.value = file
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewFile.value = null
}

const getPreviewUrl = (file) => {
  // Si c'est un fichier déjà uploadé avec un UUID
  if (file.uuid) {
    return `${API_BASE_URL}/attachments/${file.uuid}`
  }
  
  // Si c'est un fichier local, créer une URL temporaire
  return URL.createObjectURL(file)
}

const canPreview = (file) => {
  return isImage(file) || isPdf(file)
}

const isImage = (file) => {
  const mimeType = file.mimetype || file.type
  return mimeType && mimeType.startsWith('image/')
}

const isPdf = (file) => {
  const mimeType = file.mimetype || file.type
  return mimeType === 'application/pdf'
}

const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'fas fa-file'
  
  if (mimeType.startsWith('image/')) return 'fas fa-file-image'
  if (mimeType === 'application/pdf') return 'fas fa-file-pdf'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'fas fa-file-excel'
  if (mimeType.includes('word') || mimeType.includes('document')) return 'fas fa-file-word'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'fas fa-file-powerpoint'
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) return 'fas fa-file-archive'
  if (mimeType.includes('audio')) return 'fas fa-file-audio'
  if (mimeType.includes('video')) return 'fas fa-file-video'
  if (mimeType.includes('text')) return 'fas fa-file-alt'
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) return 'fas fa-file-code'
  
  return 'fas fa-file'
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Charger les fichiers existants si en mode édition
const loadExistingFiles = async () => {
  if (props.edition && props.uuid) {
    try {
      const response = await apiService.get(`attachments/object/${props.uuid}`)
      if (response && Array.isArray(response)) {
        files.value = response
      }
    } catch (error) {
      console.error('Error loading existing files:', error)
    }
  }
}

// Initialisation
onMounted(() => {
  if (props.modelValue && Array.isArray(props.modelValue)) {
    files.value = [...props.modelValue]
  }
  
  if (props.edition && props.uuid) {
    loadExistingFiles()
  }
})
</script>
