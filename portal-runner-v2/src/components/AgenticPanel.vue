<template>
  <div class="agentic-panel flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-surface-200 dark:border-surface-700">
      <div class="flex items-center gap-2">
        <i class="pi pi-sparkles text-primary text-xl"></i>
        <h3 class="font-semibold text-surface-800 dark:text-surface-100">{{ $t('chat.title') }}</h3>
      </div>
    </div>
    
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
          <div v-else class="whitespace-pre-wrap">{{ msg.content }}</div>
          
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
import { ref, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { sendMessage as sendAgentMessage } from '@/services/agent'

const props = defineProps({
  defaultMessage: { type: String, default: '' }
})

const toast = useToast()
const messagesContainer = ref(null)
const inputMessage = ref('')
const messages = ref([])
const isLoading = ref(false)
const conversationId = ref(null)

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
    const response = await sendAgentMessage(message, conversationId.value)
    
    // Update conversation ID
    if (response.conversationId) {
      conversationId.value = response.conversationId
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
  if (action.message) {
    inputMessage.value = action.message
    sendMessage()
  }
}
</script>
