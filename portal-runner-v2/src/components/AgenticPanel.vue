<template>
  <div class="agentic-panel flex flex-col h-full">
    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Welcome message -->
      <div v-if="messages.length === 0" class="text-center py-8">
        <i class="pi pi-comments text-4xl text-surface-300 dark:text-surface-600 mb-4"></i>
        <p class="text-surface-500">{{ defaultMessage || $t('chat.placeholder') }}</p>
      </div>
      
      <!-- Message list -->
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        :class="[
          'flex',
          msg.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <div 
          :class="[
            'max-w-[80%] rounded-lg px-4 py-2',
            msg.role === 'user' 
              ? 'bg-primary text-white' 
              : 'bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-100'
          ]"
        >
          <!-- Loading indicator -->
          <div v-if="msg.loading" class="flex items-center gap-2">
            <ProgressSpinner style="width: 20px; height: 20px" strokeWidth="4" />
            <span class="text-sm">{{ $t('chat.thinking') }}</span>
          </div>
          
          <!-- Message content -->
          <div v-else class="markdown-content" v-html="formatMessage(msg.content)"></div>

          <!-- Feedback buttons for assistant messages -->
          <div v-if="msg.role === 'assistant' && !msg.loading && msg.uuid && msg.content" class="mt-2 flex items-center gap-1">
            <i 
              :class="[
                'pi pi-thumbs-up text-xs p-0.5 rounded',
                msg.feedback === 'up' 
                  ? 'text-primary bg-primary/10' 
                  : msg.feedback === 'down'
                    ? 'text-surface-200 dark:text-surface-600 cursor-not-allowed opacity-50'
                    : 'text-surface-400 hover:text-primary cursor-pointer transition-colors'
              ]"
              @click="!msg.feedback && toggleFeedback(index, 'up')"
              v-tooltip.top="msg.feedback !== 'down' ? $t('chat.feedbackUp') : null"
            ></i>
            <i 
              :class="[
                'pi pi-thumbs-down text-xs p-0.5 rounded',
                msg.feedback === 'down' 
                  ? 'text-red-500 bg-red-500/10' 
                  : msg.feedback === 'up'
                    ? 'text-surface-200 dark:text-surface-600 cursor-not-allowed opacity-50'
                    : 'text-surface-400 hover:text-red-500 cursor-pointer transition-colors'
              ]"
              @click="!msg.feedback && toggleFeedback(index, 'down')"
              v-tooltip.top="msg.feedback !== 'up' ? $t('chat.feedbackDown') : null"
            ></i>
          </div>
          
          <!-- Suggested actions -->
          <div v-if="msg.suggestedActions?.length" class="mt-2 flex flex-wrap gap-2">
            <Button 
              v-for="action in msg.suggestedActions" 
              :key="action.label"
              :label="action.label"
              size="small"
              outlined
              @click="handleSuggestedAction(action)"
            />
          </div>
        </div>
      </div>
    </div>
    
    <!-- Pending attachments display -->
    <div v-if="pendingAttachments.length > 0" class="px-4 py-2 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-surface-500">{{ $t('chat.pendingAttachments') }}:</span>
        <Chip 
          v-for="attachment in pendingAttachments" 
          :key="attachment.uuid"
          :label="attachment.original_name"
          removable
          @remove="removePendingAttachment(attachment)"
          class="text-xs"
        />
      </div>
    </div>
    
    <!-- Input -->
    <div class="p-4 border-t border-surface-200 dark:border-surface-700">
      <div class="flex gap-2">
        <!-- Hidden file input -->
        <input 
          ref="fileInputRef"
          type="file"
          multiple
          class="hidden"
          @change="handleFileSelect"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log,.zip"
        />
        
        <!-- Attachment button -->
        <Button 
          icon="pi pi-paperclip" 
          text
          rounded
          @click="triggerFileUpload"
          :disabled="isLoading || isUploading"
          :loading="isUploading"
          v-tooltip.top="$t('chat.attachFiles')"
        />
        
        <InputText 
          ref="inputRef"
          v-model="inputMessage"
          :placeholder="$t('chat.placeholder')"
          class="flex-1"
          @keyup.enter="sendMessage"
          :disabled="isLoading"
        />
        <Button 
          icon="pi pi-send" 
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isLoading"
          :loading="isLoading"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import FileUpload from 'primevue/fileupload'
import Chip from 'primevue/chip'
import { sendMessage as sendAgentMessage, getConversation, updateMessageFeedback } from '@/services/agent'
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true // GitHub Flavored Markdown
})

const props = defineProps({
  defaultMessage: { type: String, default: '' },
  conversationId: { type: String, default: null }
})

const emit = defineEmits(['update:conversationId', 'conversationLoaded'])

const { t } = useI18n()
const toast = useToast()
const messagesContainer = ref(null)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const currentConversationId = ref(null)

// Attachments management
const pendingAttachments = ref([])
const isUploading = ref(false)
const fileInputRef = ref(null)
const inputRef = ref(null)

/**
 * Focus the input field
 */
const focusInput = async () => {
  await nextTick()
  inputRef.value?.$el?.focus()
}

/**
 * Load an existing conversation
 */
const loadConversation = async (convId) => {
  if (!convId) return
  
  isLoading.value = true
  try {
    const conversation = await getConversation(convId)
    if (conversation) {
      currentConversationId.value = conversation.uuid
      // Convert messages from DB format to display format
      messages.value = (conversation.messages || [])
        .filter(m => m.role !== 'tool')
        .filter(m => !(m.role === 'assistant' && !m.content))
        .map(m => ({
        uuid: m.uuid,
        role: m.role,
        content: m.content || '',
        feedback: m.feedback || null,
        loading: false
      }))
      console.log('Loaded conversation messages:', messages.value)
      emit('conversationLoaded', conversation)
      await scrollToBottom()
    }
  } catch (error) {
    console.error('Failed to load conversation:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 5000
    })
  } finally {
    isLoading.value = false
  }
}

// Watch for external conversation changes
// Note: Must be placed AFTER loadConversation is defined
watch(() => props.conversationId, async (newId) => {
  if (newId && newId !== currentConversationId.value) {
    await loadConversation(newId)
  } else if (!newId) {
    // Reset to new conversation
    messages.value = []
    currentConversationId.value = null
  }
}, { immediate: true })

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const sendMessage = async () => {
  const message = inputMessage.value.trim()
  if (!message || isLoading.value) return
  
  // Add user message
  messages.value.push({ role: 'user', content: message })
  inputMessage.value = ''
  
  // Add loading placeholder
  const loadingIndex = messages.value.length
  messages.value.push({ role: 'assistant', loading: true })
  isLoading.value = true
  
  await scrollToBottom()
  
  try {
    const response = await sendAgentMessage(message, currentConversationId.value)
    
    // Update conversation ID
    if (response.conversationId) {
      currentConversationId.value = response.conversationId
      emit('update:conversationId', response.conversationId)
    }
    
    // Replace loading with actual response
    messages.value[loadingIndex] = {
      uuid: response.messageUuid || null,
      role: 'assistant',
      content: response.response || response.message,
      feedback: null,
      suggestedActions: response.suggestedActions || []
    }
    
    // Check if a ticket was created and upload pending attachments
    if (pendingAttachments.value.length > 0) {
      // Try to extract ticket UUID from response
      const ticketUuidMatch = (response.response || '').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
      if (ticketUuidMatch && (response.response || '').toLowerCase().includes('créé')) {
        const ticketUuid = ticketUuidMatch[0]
        console.log('Ticket created, uploading pending attachments to:', ticketUuid)
        try {
          await uploadPendingAttachments(ticketUuid)
          toast.add({
            severity: 'success',
            summary: t('chat.attachmentUploaded'),
            detail: t('chat.filesUploaded'),
            life: 3000
          })
        } catch (uploadError) {
          console.error('Failed to upload attachments:', uploadError)
          toast.add({
            severity: 'warn',
            summary: t('chat.uploadError'),
            detail: uploadError.message,
            life: 5000
          })
        }
      }
    }
  } catch (error) {
    console.error('Agent error:', error)
    messages.value[loadingIndex] = {
      role: 'assistant',
      content: error.message || 'An error occurred'
    }
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 5000
    })
  } finally {
    isLoading.value = false
    await scrollToBottom()
    await focusInput()
  }
}

const handleSuggestedAction = (action) => {
  console.log('handleSuggestedAction:', action)
  
  // If action.message exists, use it directly
  if (action.message) {
    inputMessage.value = action.message
    sendMessage()
    return
  }
  
  // Otherwise, handle based on action code
  switch (action.action) {
    case 'search':
      inputMessage.value = action.params?.query || action.label || 'Search...'
      sendMessage()
      break
    case 'create_ticket':
      inputMessage.value = 'I would like to create a ticket'
      sendMessage()
      break
    case 'report_incident':
      inputMessage.value = 'I would like to report an incident'
      sendMessage()
      break
    case 'list_tickets':
      inputMessage.value = 'Show my tickets'
      sendMessage()
      break
    case 'request_access':
      inputMessage.value = 'I need access to an application'
      sendMessage()
      break
    case 'browse_catalog':
      if (action.params?.url) {
        window.open(action.params.url, '_blank')
      } else {
        inputMessage.value = 'Show me the service catalog'
        sendMessage()
      }
      break
    case 'track_ticket':
      inputMessage.value = action.params?.ticketId 
        ? `Status of ticket ${action.params.ticketId}` 
        : 'Track a ticket'
      sendMessage()
      break
    case 'submit_ticket':
      inputMessage.value = 'Submit the ticket'
      sendMessage()
      break
    case 'add_details':
      // Focus on input for user to add details
      break
    default:
      // For unknown actions, use the label as a message
      if (action.label) {
        inputMessage.value = action.label
        sendMessage()
      } else {
        console.warn('Unhandled action:', action.action)
      }
  }
}

/**
 * Format message content for display
 * - Renders markdown to HTML
 */
const formatMessage = (content) => {
  if (!content) return ''
  return marked.parse(content)
}

/**
 * Toggle feedback on a message
 */
const toggleFeedback = async (index, feedbackType) => {
  const msg = messages.value[index]
  if (!msg?.uuid) return
  
  // Toggle: if same feedback, clear it; otherwise set new feedback
  const newFeedback = msg.feedback === feedbackType ? null : feedbackType
  
  try {
    await updateMessageFeedback(msg.uuid, newFeedback)
    messages.value[index].feedback = newFeedback
  } catch (error) {
    console.error('Failed to update feedback:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message,
      life: 3000
    })
  }
}

/**
 * Start a new conversation (clear current)
 */
const startNewConversation = () => {
  messages.value = []
  currentConversationId.value = null
  pendingAttachments.value = []
  emit('update:conversationId', null)
}

/**
 * Trigger file input click
 */
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

/**
 * Handle file selection - stores files locally without uploading
 * Files will be uploaded after ticket creation
 */
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  
  // Store files locally (no upload yet)
  files.forEach(file => {
    pendingAttachments.value.push({
      file: file,
      name: file.name,
      size: file.size,
      type: file.type,
      // No UUID yet - will be assigned after upload
    })
  })
  
  toast.add({
    severity: 'info',
    summary: t('chat.filesAdded'),
    detail: `${files.length} ${t('chat.filesReadyToAttach')}`,
    life: 3000
  })
  
  // Notify the agent about the attached files
  const fileNames = files.map(f => f.name).join(', ')
  messages.value.push({ 
    role: 'user', 
    content: `📎 ${t('chat.attachedFiles')}: ${fileNames}`,
    isAttachmentNotice: true
  })
  await scrollToBottom()
  
  // Reset file input
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

/**
 * Remove a pending attachment (local file, not yet uploaded)
 */
const removePendingAttachment = (attachment) => {
  // Remove by name since local files don't have UUID yet
  pendingAttachments.value = pendingAttachments.value.filter(a => a.name !== attachment.name)
}

/**
 * Get pending files for ticket creation
 */
const getPendingFiles = () => {
  return pendingAttachments.value.map(a => a.file)
}

/**
 * Upload pending attachments to a ticket after creation
 * @param {string} ticketUuid - UUID of the created ticket
 */
const uploadPendingAttachments = async (ticketUuid) => {
  if (!pendingAttachments.value.length || !ticketUuid) {
    return []
  }
  
  const files = pendingAttachments.value.map(a => a.file)
  
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const token = localStorage.getItem('portal_token')
    // Use existing endpoint: POST /attachments/:entityType/:entityUuid
    const response = await fetch(`/api/v1/attachments/tickets/${ticketUuid}`, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: formData
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || 'Upload failed')
    }
    
    const result = await response.json()
    console.log('Attachments uploaded:', result)
    
    // Clear pending attachments after successful upload
    pendingAttachments.value = []
    
    return result || []
  } catch (error) {
    console.error('Error uploading attachments:', error)
    throw error
  }
}

/**
 * Clear pending attachments
 */
const clearPendingAttachments = () => {
  pendingAttachments.value = []
}

// Expose methods for parent component
defineExpose({
  loadConversation,
  startNewConversation,
  getPendingFiles,
  uploadPendingAttachments,
  clearPendingAttachments,
  pendingAttachments
})
</script>

<style scoped>
/* Markdown styling for assistant messages */
:deep(.markdown-content) {
  line-height: 1.4;
}

:deep(.markdown-content h1),
:deep(.markdown-content h2),
:deep(.markdown-content h3),
:deep(.markdown-content h4),
:deep(.markdown-content h5),
:deep(.markdown-content h6) {
  font-weight: 600;
  margin-top: 0.5em;
  margin-bottom: 0.25em;
}

:deep(.markdown-content h1) { font-size: 1.3em; }
:deep(.markdown-content h2) { font-size: 1.2em; }
:deep(.markdown-content h3) { font-size: 1.1em; }

:deep(.markdown-content p) {
  margin-bottom: 0.4em;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content ul) {
  margin-left: 1.25em;
  margin-bottom: 0.4em;
  padding-left: 0;
  list-style-type: disc;
}

:deep(.markdown-content ol) {
  margin-left: 1.25em;
  margin-bottom: 0.4em;
  padding-left: 0;
  list-style-type: decimal;
}

:deep(.markdown-content li) {
  margin-bottom: 0.15em;
  display: list-item;
}

:deep(.markdown-content li p) {
  margin-bottom: 0.15em;
}

:deep(.markdown-content strong) {
  font-weight: 600;
}

:deep(.markdown-content code) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.1em 0.3em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

:deep(.markdown-content pre) {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.5em;
  border-radius: 6px;
  overflow-x: auto;
  margin-bottom: 0.4em;
}

:deep(.markdown-content pre code) {
  background: none;
  padding: 0;
}

:deep(.markdown-content blockquote) {
  border-left: 3px solid currentColor;
  opacity: 0.8;
  padding-left: 0.75em;
  margin-left: 0;
  margin-bottom: 0.4em;
}
</style>
