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
    
    <!-- Input -->
    <div class="p-4 border-t border-surface-200 dark:border-surface-700">
      <div class="flex gap-2">
        <InputText 
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
import { ref, nextTick, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { sendMessage as sendAgentMessage, getConversation } from '@/services/agent'
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

const toast = useToast()
const messagesContainer = ref(null)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const currentConversationId = ref(null)

// Watch for external conversation changes
watch(() => props.conversationId, async (newId) => {
  if (newId && newId !== currentConversationId.value) {
    await loadConversation(newId)
  } else if (!newId) {
    // Reset to new conversation
    messages.value = []
    currentConversationId.value = null
  }
}, { immediate: true })

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
      messages.value = (conversation.messages || []).filter(m => m.role !== 'tool').map(m => ({
        role: m.role,
        content: m.content || '',
        loading: false
      }))
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
      role: 'assistant',
      content: response.response || response.message,
      suggestedActions: response.suggestedActions || []
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
 * Start a new conversation (clear current)
 */
const startNewConversation = () => {
  messages.value = []
  currentConversationId.value = null
  emit('update:conversationId', null)
}

// Expose methods for parent component
defineExpose({
  loadConversation,
  startNewConversation
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
