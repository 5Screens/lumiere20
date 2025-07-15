<template>
  <div class="s-file-uploader" :class="{ 'has-error': showError }">
    
    <!-- Label du composant -->
    <div class="s-file-uploader__label-container" v-if="label">
      <label class="s-file-uploader__label" :class="{ 's-file-uploader__label--required': required }">
        {{ label }}
      </label>
    </div>

    <!-- Zone de drag & drop -->
    <div 
      class="s-file-uploader__dropzone" 
      :class="{ 'is-dragging': isDragging }"
      @dragover.prevent="handleDragOver"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <button class="button-standard variant-primary">
        {{ t('fileUploader.browse_button') }}
      </button>
      <div class="s-file-uploader__drag-drop-text" v-if="!files.length">
        {{ t('fileUploader.or') }}
        <div>{{ placeholder || t('fileUploader.dropzone_placeholder') }}</div>
      </div>
      <div class="s-file-uploader__helper-text" v-if="helperText">
        {{ helperText }}
      </div>
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

    <!-- Indicateur d'avancement -->
    <div class="s-file-uploader__upload-status" v-if="isUploading">
      <div class="s-file-uploader__upload-progress">
        <div class="s-file-uploader__upload-progress-bar"></div>
      </div>
      <div class="s-file-uploader__upload-status-text">
        {{ t('fileUploader.uploading') }}
      </div>
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
            @click.stop="openPreview(file)"
            :title="t('fileUploader.preview')"
          >
            <i class="fas fa-eye"></i>
          </button>
          
          <!-- Bouton de téléchargement -->
          <button
            v-if="file.uuid"
            class="s-file-uploader__action-button download"
            @click.stop="downloadFile(file)"
            :title="t('fileUploader.download', 'Télécharger')"
          >
            <i class="fas fa-download"></i>
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
import { useTabsStore } from '@/stores/tabsStore'
import { useUserProfileStore } from '@/stores/userProfileStore'
import '@/assets/styles/sFileUploader.css'
import '@/assets/styles/ButtonStandard.css'

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
const tabsStore = useTabsStore()
const userProfileStore = useUserProfileStore()

// État réactif
const fileInput = ref(null)
const files = ref([])
const isDragging = ref(false)
const showPreview = ref(false)
const previewFile = ref(null)
const isUploading = ref(false)
const uploadProgress = ref(0)
const uploadErrors = ref([])

// Variables pour la prévisualisation des fichiers

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
}, { immediate: true, deep: true })

/**
 * Récupère les fichiers en attente d'upload (sans UUID)
 * @returns {Array} - Liste des fichiers en attente
 */
const getPendingFiles = () => {
  // Retourner uniquement les fichiers qui n'ont pas encore d'UUID
  // (les fichiers qui n'ont pas encore été uploadés)
  return files.value.filter(file => !file.uuid)
}

/**
 * Upload les fichiers avec l'UUID fourni
 * @param {string} objectUuid - UUID de l'objet parent
 * @param {string} objectType - Type d'objet parent
 * @returns {Promise<Array>} - Liste des fichiers uploadés
 */
const uploadFilesWithUuid = async (objectUuid, objectType) => {
  if (!objectUuid || !files.value.length) {
    return []
  }
  
  const pendingFiles = files.value.filter(file => !file.uuid)
  if (!pendingFiles.length) {
    return []
  }
  
  try {
    isUploading.value = true
    const uploadedFiles = []
    
    // Préparer le FormData
    const formData = new FormData()
    pendingFiles.forEach(file => {
      formData.append('files', file)
    })
    formData.append('objectType', objectType || props.fieldName.toUpperCase())
    formData.append('objectUuid', objectUuid)
    
    // Appeler l'API
    const response = await apiService.uploadFormData('attachments/upload-multiple', formData)
    
    if (response && response.attachments) {
      uploadedFiles.push(...response.attachments)
      
      // Mettre à jour la liste des fichiers
      const newFiles = files.value.filter(file => file.uuid) // Garder les fichiers déjà uploadés
      newFiles.push(...response.attachments) // Ajouter les nouveaux fichiers uploadés
      files.value = newFiles
      
      // Émettre l'événement de mise à jour
      emit('update:modelValue', files.value)
      
      // Notification de succès
      tabsStore.setMessage(t('fileUploader.upload_success', {count: uploadedFiles.length}))
    }
    
    return uploadedFiles
  } catch (error) {
    console.error('Error uploading files:', error)
    emit('error', [error.message || 'Upload failed'])
    // Notification d'erreur
    tabsStore.setMessage(t('fileUploader.upload_error') + ': ' + (error.message || 'Upload failed'))
    return []
  } finally {
    isUploading.value = false
  }
}

// Exposer les méthodes pour qu'elles soient accessibles depuis l'extérieur
defineExpose({
  getPendingFiles,
  uploadFilesWithUuid
})

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
    // Notification d'erreur pour les fichiers invalides
    if (errors.length > 0) {
      tabsStore.setMessage(t('fileUploader.upload_error') + ': ' + errors[0])
    }
  }

  // Si en mode édition ET que nous avons un UUID, uploader les fichiers immédiatement
  // Sinon, simplement les ajouter à la liste sans appel API
  if (props.edition && props.uuid && validFiles.length) {
    try {
      await uploadFiles(validFiles)
    } catch (error) {
      console.error('Erreur lors de l\'upload des fichiers:', error)
      // En cas d'erreur, ajouter quand même les fichiers à la liste locale
      files.value = [...files.value, ...validFiles]
    }
  } else {
    // En mode création ou sans UUID, ajouter simplement les fichiers à la liste
    files.value = [...files.value, ...validFiles]
    
    // Émettre l'événement de mise à jour pour informer le parent
    emit('update:modelValue', files.value)
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
      formData.append('uploadedBy', userProfileStore.id)

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
      formData.append('uploadedBy', userProfileStore.id)

      // Utiliser apiService pour l'upload avec FormData
      const response = await apiService.uploadFormData('attachments/upload', formData)
      
      if (response && response.attachment) {
        uploadedFiles.push(response.attachment)
      }
    }

    // Mettre à jour la liste des fichiers
    files.value = [...files.value, ...uploadedFiles]
    
    // Émettre l'événement de mise à jour
    emit('update:modelValue', files.value)
    
    // Notification de succès
    if (uploadedFiles.length > 0) {
      tabsStore.setMessage(t('fileUploader.upload_success', {count: uploadedFiles.length}))
    }
  } catch (error) {
    console.error('Erreur lors de l\'upload des fichiers:', error)
    errors.push(error.message || 'Upload failed')
    emit('error', errors)
    
    // Notification d'erreur
    tabsStore.setMessage(t('fileUploader.upload_error') + ': ' + (error.message || 'Upload failed'))
  } finally {
    isUploading.value = false
    uploadProgress.value = 0 // Réinitialiser l'indicateur visuel d'avancement
  }
}

const removeFile = async (file, index) => {
  try {
    // Utiliser la confirmation globale via tabsStore
    await tabsStore.confirm(t('fileUploader.delete_confirm'))
    
    // Si on arrive ici, l'utilisateur a confirmé la suppression
    if (!file) return
  
    // Si en mode édition, que le fichier a un UUID et qu'on a un UUID d'objet, le supprimer du serveur
    if (props.edition && file.uuid && props.uuid) {
      try {
        await apiService.delete(`attachments/${file.uuid}`)
        files.value = files.value.filter(f => f.uuid !== file.uuid)
        
        // Notification de succès
        tabsStore.setMessage(t('fileUploader.delete_success'))
      } catch (error) {
        console.error('Erreur lors de la suppression du fichier:', error)
        emit('error', [error.message || 'Échec de la suppression'])
        
        // Notification d'erreur
        tabsStore.setMessage(t('fileUploader.delete_error') + ': ' + (error.message || 'Échec de la suppression'))
        
        // En cas d'erreur, on supprime quand même le fichier de la liste locale
        files.value.splice(index, 1)
      }
    } else {
      // Sinon, simplement le retirer de la liste
      files.value.splice(index, 1)
      
      // Notification de succès (même en mode création)
      tabsStore.setMessage(t('fileUploader.delete_success'))
    }
    
    // Émettre l'événement de mise à jour
    emit('update:modelValue', files.value)
  } catch (error) {
    // L'utilisateur a annulé la suppression ou une autre erreur s'est produite
    console.log('Suppression annulée ou erreur:', error)
  }
}

const openPreview = (file) => {
  previewFile.value = file
  showPreview.value = true
}

const closePreview = () => {
  showPreview.value = false
  previewFile.value = null
}

/**
 * Télécharge un fichier en forçant le téléchargement au lieu de l'affichage
 * @param {Object} file - Fichier à télécharger
 */
const downloadFile = (file) => {
  if (!file || !file.uuid) return
  
  // Utiliser fetch pour récupérer le fichier en tant que blob
  fetch(`${API_BASE_URL}/attachments/${file.uuid}`)
    .then(response => response.blob())
    .then(blob => {
      // Créer une URL pour le blob
      const blobUrl = window.URL.createObjectURL(blob)
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = file.originalname || file.name // Force le téléchargement
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(blobUrl)
      }, 100)
    })
    .catch(error => {
      console.error('Erreur lors du téléchargement du fichier:', error)
    })
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
  // Ne charger les fichiers existants que si nous sommes en mode édition ET que nous avons un UUID
  if (props.edition && props.uuid) {
    try {
      console.info(`Chargement des fichiers existants pour l'objet ${props.uuid}`)
      const response = await apiService.get(`attachments/object/${props.uuid}`)
      if (response && Array.isArray(response)) {
        files.value = response
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers existants:', error)
      // En cas d'erreur, ne pas bloquer l'utilisation du composant
      // Simplement logger l'erreur et continuer avec une liste vide
    }
  } else {
    console.info('Mode création ou UUID manquant - pas de chargement de fichiers existants')
  }
}

// Initialisation
onMounted(() => {
  if (props.modelValue && Array.isArray(props.modelValue)) {
    files.value = [...props.modelValue]
  }
  
  // Ne charger les fichiers existants que si nous sommes en mode édition ET que nous avons un UUID
  if (props.edition && props.uuid) {
    loadExistingFiles()
  }
})
</script>
