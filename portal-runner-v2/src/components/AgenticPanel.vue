<template>
  <div class="agentic-panel flex flex-col h-full bg-surface-0 dark:bg-surface-900">
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
          
          <!-- Message content with collapse/expand -->
          <div 
            v-else 
            :ref="el => setMessageRef(el, index)"
            :class="[
              'markdown-content',
              { 'message-collapsed': msg.isOverflowing && !msg.expanded }
            ]"
            :role="msg.isOverflowing ? 'button' : undefined"
            :tabindex="msg.isOverflowing ? 0 : undefined"
            @click="toggleMessage(index)"
            @keydown.enter.prevent="toggleMessage(index)"
            @keydown.space.prevent="toggleMessage(index)"
            v-html="formatMessage(msg.content)"
          ></div>

          <!-- Meta: feedback + copy for assistant messages -->
          <div v-if="msg.role === 'assistant' && !msg.loading && msg.content" class="mt-2 flex items-center gap-1">
            <!-- Copy button -->
            <i 
              :class="[
                'pi text-xs p-0.5 rounded cursor-pointer transition-colors',
                msg.copied ? 'pi-check text-green-500' : 'pi-copy text-surface-400 hover:text-primary'
              ]"
              @click.stop="copyMessage(index)"
              v-tooltip.top="msg.copied ? $t('chat.copied') : $t('chat.copyResponse')"
            ></i>
            
            <!-- Feedback buttons (only if msg has uuid) -->
            <template v-if="msg.uuid">
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
            </template>
            <!-- Ellipsis indicator for collapsed messages (aligned right) -->
            <span 
              v-if="msg.isOverflowing && !msg.expanded" 
              class="flex-1 text-right text-surface-400 cursor-pointer select-none"
              @click.stop="toggleMessage(index)"
            >...</span>
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
    <div class="px-3 py-2 border-t border-surface-200 dark:border-surface-700">
      <!-- Hidden file input -->
      <input 
        ref="fileInputRef"
        type="file"
        multiple
        class="hidden"
        @change="handleFileSelect"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.log,.zip"
      />
      
      <!-- Textarea with voice transcription overlay -->
      <div class="relative">
        <Textarea 
          ref="inputRef"
          v-model="inputMessage"
          :placeholder="isSessionActive ? '' : $t('chat.placeholder')"
          class="w-full resize-none"
          :autoResize="true"
          rows="2"
          :style="{ maxHeight: '21rem', overflowY: 'auto' }"
          @keydown="onKeydown"
          :disabled="isLoading"
          :readonly="isSessionActive"
        />
        <!-- Live transcription overlay -->
        <div 
          v-if="isSessionActive && transcription && !isSpeaking" 
          class="absolute inset-0 flex items-start p-3 pointer-events-none bg-surface-0 dark:bg-surface-900 rounded-md"
        >
          <span class="text-surface-700 dark:text-surface-200">{{ transcription }}</span>
        </div>
      </div>
      
      <!-- Footer with buttons aligned right -->
      <div class="flex justify-end">
        <!-- OCR button -->
        <Button 
          icon="pi pi-file-pdf" 
          text
          rounded
          @click="$emit('open-ocr')"
          :disabled="isLoading"
          v-tooltip.top="$t('ocr.scanDocument')"
          class="text-primary hover:text-primary-600"
        />
        
        <!-- Documents button -->
        <Button 
          icon="pi pi-folder" 
          text
          rounded
          @click="$emit('open-documents')"
          :disabled="isLoading"
          v-tooltip.top="$t('documents.drawerTitle')"
          class="text-primary hover:text-primary-600"
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
          class="text-primary hover:text-primary-600"
        />
        
        <!-- Voice input / TTS stop button -->
        <Button 
          v-if="isVoiceSupported"
          :icon="isSessionActive ? (isSpeaking ? 'pi pi-stop-circle' : 'pi pi-microphone') : 'pi pi-microphone'"
          :class="[
            'transition-all duration-200 select-none',
            isSessionActive
              ? (isSpeaking 
                  ? 'text-red-500 hover:text-red-600'
                  : 'text-green-500 hover:text-green-600 animate-pulse')
              : 'text-primary hover:text-primary-600'
          ]"
          text
          rounded
          @click="toggleSession"
          :disabled="isLoading || isConnecting"
          :loading="isConnecting"
          v-tooltip.top="isSessionActive ? $t('voice.stopSession') : $t('voice.startSession')"
        />
        
        <!-- Send button -->
        <Button 
          icon="pi pi-send" 
          text
          rounded
          @click="sendMessage"
          :disabled="!inputMessage.trim() || isLoading || isSessionActive"
          :loading="isLoading"
          class="text-primary hover:text-primary-600"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useFullDuplexVoice } from '@/composables/useFullDuplexVoice'
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

const emit = defineEmits(['update:conversationId', 'conversationLoaded', 'open-ocr', 'open-documents'])

const { t } = useI18n()
const toast = useToast()
const messagesContainer = ref(null)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const currentConversationId = ref(null)
const messageRefs = ref([])

// Constants for collapsed messages
const COLLAPSED_MAX_HEIGHT = 160

// Attachments management
const pendingAttachments = ref([])
const isUploading = ref(false)
const fileInputRef = ref(null)
const inputRef = ref(null)

// Full-duplex voice conversation
const handleFullDuplexUserMessage = async (finalText) => {
  console.log('[AgenticPanel] Full-duplex user message:', finalText)
  if (finalText && finalText.trim()) {
    // Add user message to UI
    messages.value.push({ role: 'user', content: finalText.trim() })
    
    // Add loading placeholder
    const loadingIndex = messages.value.length
    messages.value.push({ role: 'assistant', loading: true })
    isLoading.value = true
    
    await scrollToBottom()
    
    try {
      // Send to LLM with voice input mode
      const response = await sendAgentMessage(finalText.trim(), currentConversationId.value, 'voice')
      
      // Update conversation ID
      if (response.conversationId) {
        currentConversationId.value = response.conversationId
        emit('update:conversationId', response.conversationId)
      }
      
      // Replace loading with actual response
      const assistantContent = response.response || response.message
      messages.value[loadingIndex] = {
        uuid: response.messageUuid || null,
        role: 'assistant',
        content: assistantContent,
        feedback: null,
        suggestedActions: response.suggestedActions || []
      }
      
      // Speak the response via full-duplex TTS
      if (assistantContent && isSessionActive.value) {
        console.log('[AgenticPanel] Speaking AI response via full-duplex TTS')
        speak(assistantContent)
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
    }
  }
}

const { 
  isSessionActive,
  isConnecting,
  isSupported: isVoiceSupported,
  currentState: voiceState,
  transcription,
  isUserSpeaking,
  isSpeaking,
  toggleSession,
  speak
} = useFullDuplexVoice({ 
  onUserMessage: handleFullDuplexUserMessage,
  onStateChange: (state) => console.log('[AgenticPanel] Voice state:', state)
})

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

// Message refs for overflow detection
const setMessageRef = (el, index) => {
  if (el) {
    messageRefs.value[index] = el
    nextTick(() => {
      updateOverflowState(index)
    })
  } else {
    messageRefs.value.splice(index, 1)
  }
}

const updateOverflowState = (index) => {
  const el = messageRefs.value[index]
  const message = messages.value[index]
  if (!el || !message) return
  
  el.offsetHeight // Force reflow
  const isOverflowing = el.scrollHeight > COLLAPSED_MAX_HEIGHT + 1
  
  if (message.isOverflowing !== isOverflowing) {
    message.isOverflowing = isOverflowing
  }
}

const toggleMessage = (index) => {
  // Check if user is selecting text
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) return
  
  const target = messages.value[index]
  if (!target || !target.isOverflowing) return
  
  target.expanded = !target.expanded
  if (target.expanded) {
    scrollToBottom()
  }
}

// Copy message functionality
const copyTimers = new WeakMap()

const copyMessage = async (index) => {
  const message = messages.value[index]
  if (!message) return
  
  try {
    const text = message.content
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textareaElement = document.createElement('textarea')
      textareaElement.value = text
      textareaElement.setAttribute('readonly', '')
      textareaElement.style.position = 'absolute'
      textareaElement.style.left = '-9999px'
      document.body.appendChild(textareaElement)
      textareaElement.select()
      document.execCommand('copy')
      document.body.removeChild(textareaElement)
    }
    
    message.copied = true
    
    if (copyTimers.has(message)) {
      clearTimeout(copyTimers.get(message))
    }
    
    const timeoutId = setTimeout(() => {
      message.copied = false
      copyTimers.delete(message)
    }, 3000)
    
    copyTimers.set(message, timeoutId)
  } catch (error) {
    console.error('[AgenticPanel] Unable to copy message', error)
  }
}

/**
 * Handle keydown in textarea
 * Enter alone = send message
 * Shift+Enter = new line (default behavior, not prevented)
 */
const onKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const sendMessage = async (options = {}) => {
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
    // Text input mode (voice is handled by full-duplex composable)
    const response = await sendAgentMessage(message, currentConversationId.value, 'text')
    
    // Update conversation ID
    if (response.conversationId) {
      currentConversationId.value = response.conversationId
      emit('update:conversationId', response.conversationId)
    }
    
    // Replace loading with actual response
    const assistantContent = response.response || response.message
    messages.value[loadingIndex] = {
      uuid: response.messageUuid || null,
      role: 'assistant',
      content: assistantContent,
      feedback: null,
      suggestedActions: response.suggestedActions || []
    }
    
    // Clear pending attachments if a ticket was created
    // (attachments are now linked via the agent's create_ticket tool with attachment_uuids)
    if (pendingAttachments.value.length > 0) {
      const responseText = (response.response || '').toLowerCase()
      if (responseText.includes('créé') || responseText.includes('created')) {
        console.log('Ticket created, clearing pending attachments display')
        pendingAttachments.value = []
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
 * Handle file selection - uploads files immediately to backend
 * Files are stored with entity_type='agent_conversation' so the agent can find them
 */
const handleFileSelect = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  
  // Reset file input immediately
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  
  isUploading.value = true
  
  try {
    // We need a conversation ID to link attachments
    // If no conversation exists yet, we'll create one by sending a system message first
    let convId = currentConversationId.value
    
    if (!convId) {
      // Create conversation by sending a placeholder message
      const initResponse = await sendAgentMessage('__init_conversation__', null)
      if (initResponse.conversationId) {
        convId = initResponse.conversationId
        currentConversationId.value = convId
        emit('update:conversationId', convId)
      }
    }
    
    if (!convId) {
      throw new Error('Could not create conversation for attachments')
    }
    
    // Upload files to backend with entity_type='agent_conversation'
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    const token = localStorage.getItem('portal_token')
    const response = await fetch(`/api/v1/attachments/agent_conversation/${convId}`, {
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
    
    const uploadedAttachments = await response.json()
    console.log('Files uploaded to backend:', uploadedAttachments)
    
    // Store uploaded attachments with their UUIDs
    uploadedAttachments.forEach(att => {
      pendingAttachments.value.push({
        uuid: att.uuid,
        original_name: att.original_name,
        file_name: att.file_name,
        mime_type: att.mime_type,
        file_size: att.file_size
      })
    })
    
    toast.add({
      severity: 'success',
      summary: t('chat.filesUploaded'),
      detail: `${files.length} ${t('chat.filesReadyToAttach')}`,
      life: 3000
    })
    
    // Send message to agent about the attached files
    const fileNames = files.map(f => f.name).join(', ')
    const attachmentMessage = `📎 ${t('chat.attachedFiles')}: ${fileNames}`
    
    // Add user message to UI
    messages.value.push({ 
      role: 'user', 
      content: attachmentMessage
    })
    
    // Add loading placeholder for assistant response
    const loadingIndex = messages.value.length
    messages.value.push({ role: 'assistant', loading: true })
    isLoading.value = true
    
    await scrollToBottom()
    
    // Send to agent API (will save to DB and get AI response)
    const agentResponse = await sendAgentMessage(attachmentMessage, convId)
    
    // Replace loading with actual response
    messages.value[loadingIndex] = {
      uuid: agentResponse.messageUuid || null,
      role: 'assistant',
      content: agentResponse.response || agentResponse.message,
      feedback: null,
      suggestedActions: agentResponse.suggestedActions || []
    }
  } catch (error) {
    console.error('File upload error:', error)
    toast.add({
      severity: 'error',
      summary: t('chat.uploadError'),
      detail: error.message,
      life: 5000
    })
  } finally {
    isUploading.value = false
    isLoading.value = false
    await scrollToBottom()
    await focusInput()
  }
}

/**
 * Remove a pending attachment (already uploaded to backend)
 * Deletes from backend and removes from local list
 */
const removePendingAttachment = async (attachment) => {
  // If attachment has UUID, delete from backend
  if (attachment.uuid) {
    try {
      const token = localStorage.getItem('portal_token')
      await fetch(`/api/v1/attachments/${attachment.uuid}`, {
        method: 'DELETE',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      })
      console.log('Attachment deleted from backend:', attachment.uuid)
    } catch (error) {
      console.error('Failed to delete attachment from backend:', error)
    }
  }
  
  // Remove from local list
  pendingAttachments.value = pendingAttachments.value.filter(a => a.uuid !== attachment.uuid)
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

/* Collapsed message */
.message-collapsed {
  max-height: 160px;
  overflow: hidden;
  cursor: pointer;
}
</style>
