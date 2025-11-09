<template>
  <div class="agentic-panel">
    <div class="agentic-header">
      <i class="fas fa-brain"></i>
      <span>Agentic Lumière</span>
    </div>
    
    <div class="agentic-messages" ref="messagesContainer">
      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="['message', message.type]"
      >
        <div
          class="message-content"
          :class="{ collapsed: message.isOverflowing && !message.expanded }"
          role="button"
          tabindex="0"
          :aria-expanded="message.expanded"
          :ref="(el) => setMessageRef(el, index)"
          @click="toggleMessage(index)"
          @keydown.enter.prevent="toggleMessage(index)"
          @keydown.space.prevent="toggleMessage(index)"
          @blur="handleMessageBlur(index, $event)"
        >
          {{ message.text }}
        </div>
        <div class="message-meta">
          <div class="message-time">{{ message.time }}</div>
          <button
            v-if="message.type === 'bot'"
            type="button"
            class="copy-button"
            :data-tooltip="message.copied ? 'Copied!' : 'Copy response'"
            aria-label="Copy response"
            @click.stop="copyMessage(index)"
          >
            <i :class="message.copied ? 'fas fa-check' : 'fas fa-copy'"></i>
          </button>
        </div>
      </div>
      
      <!-- Loading indicator -->
      <div v-if="isLoading" class="message bot">
        <div class="message-content loading">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="agentic-input-wrapper">
      <div class="input-container">
        <textarea
          v-model="inputText"
          @keydown.enter.exact.prevent="sendMessage"
          @input="adjustTextareaHeight"
          ref="textarea"
          placeholder="Demandez ce que vous voulez..."
          rows="1"
          :style="{ height: textareaHeight }"
        ></textarea>
      </div>
      <div class="controls-container">
        <div class="scrollbar-placeholder"></div>
        <button @click="sendMessage" :disabled="!inputText.trim()" class="send-button">
          <i class="fas fa-arrow-up"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { sendMessage as sendMessageToAgent } from '../services/agent'

const props = defineProps({
  defaultMessage: {
    type: String,
    default: 'En cours d\'implémentation'
  }
})

const COLLAPSED_MAX_HEIGHT = 160

const messages = ref([])
const inputText = ref('')
const messagesContainer = ref(null)
const textarea = ref(null)
const textareaHeight = ref('auto')
const messageRefs = ref([])
const isLoading = ref(false)

const formatTime = () => {
  const now = new Date()
  return now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

const setMessageRef = (el, index) => {
  if (el) {
    messageRefs.value[index] = el
    // Defer overflow check to ensure DOM is fully rendered
    nextTick(() => {
      updateOverflowState(index)
    })
  } else {
    messageRefs.value.splice(index, 1)
  }
}

const adjustTextareaHeight = async () => {
  const el = textarea.value
  if (!el) return
  
  // Reset height to auto to get the correct scrollHeight
  el.style.height = 'auto'
  el.style.overflowY = 'hidden'
  
  // Calculate new height (max 25% of viewport height)
  const maxHeight = window.innerHeight * 0.25
  const newHeight = Math.min(el.scrollHeight, maxHeight)
  const newHeightPx = `${newHeight}px`
  
  textareaHeight.value = newHeightPx
  el.style.height = newHeightPx
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  
  await nextTick()
}

const updateOverflowState = (index) => {
  const el = messageRefs.value[index]
  const message = messages.value[index]

  if (!el || !message) return

  // Force a reflow to ensure accurate measurements
  el.offsetHeight
  
  const isOverflowing = el.scrollHeight > COLLAPSED_MAX_HEIGHT + 1

  if (message.isOverflowing !== isOverflowing) {
    message.isOverflowing = isOverflowing
  }
}

const toggleMessage = (index) => {
  // Check if user is selecting text
  const selection = window.getSelection()
  if (selection && !selection.isCollapsed) {
    return
  }
  
  const target = messages.value[index]
  if (!target || !target.isOverflowing) return

  target.expanded = !target.expanded

  if (target.expanded) {
    scrollToBottom()
  }
}

const collapseMessage = (index) => {
  const target = messages.value[index]
  if (!target || !target.isOverflowing) return

  target.expanded = false
}

const handleMessageBlur = (index, event) => {
  const el = messageRefs.value[index]
  if (!el) return

  // Delay the collapse check to allow selection to complete
  setTimeout(() => {
    const selection = window.getSelection ? window.getSelection() : null

    if (selection && !selection.isCollapsed) {
      const anchorInside = selection.anchorNode && el.contains(selection.anchorNode)
      const focusInside = selection.focusNode && el.contains(selection.focusNode)

      if (anchorInside || focusInside) {
        return
      }
    }

    collapseMessage(index)
  }, 100)
}

const copyTimers = new WeakMap()

const copyMessage = async (index) => {
  const message = messages.value[index]
  if (!message) return

  try {
    const text = message.text
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

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return
  
  const userMessage = inputText.value.trim()
  
  // Add user message
  messages.value.push({
    type: 'user',
    text: userMessage,
    time: formatTime(),
    expanded: false,
    isOverflowing: false,
    copied: false
  })
  
  inputText.value = ''
  textareaHeight.value = 'auto'
  scrollToBottom()

  const newIndex = messages.value.length - 1
  nextTick(() => {
    updateOverflowState(newIndex)
  })
  
  // Build conversation history for context
  const conversationHistory = messages.value
    .slice(0, -1) // Exclude the message we just added
    .map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }))
  
  // Call AI agent
  isLoading.value = true
  
  try {
    const response = await sendMessageToAgent(userMessage, conversationHistory)
    
    // Add bot response
    messages.value.push({
      type: 'bot',
      text: response.data.message,
      time: formatTime(),
      expanded: false,
      isOverflowing: false,
      copied: false
    })
    scrollToBottom()

    const botIndex = messages.value.length - 1
    nextTick(() => {
      updateOverflowState(botIndex)
    })
  } catch (error) {
    console.error('[AgenticPanel] Error sending message:', error)
    
    // Add error message
    messages.value.push({
      type: 'bot',
      text: 'Désolé, une erreur s\'est produite. Veuillez réessayer.',
      time: formatTime(),
      expanded: false,
      isOverflowing: false,
      copied: false
    })
    scrollToBottom()

    const botIndex = messages.value.length - 1
    nextTick(() => {
      updateOverflowState(botIndex)
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  // No welcome message - panel starts empty
})
</script>

<style scoped>
.agentic-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e0e0e0;
}

.agentic-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: var(--primary-color, #FF6B00);
  color: #fff;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.agentic-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  align-self: flex-end;
}

.message.bot {
  align-self: flex-start;
}

.message-content {
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  white-space: pre-wrap;
  max-height: none;
  overflow: visible;
  position: relative;
  cursor: default;
  transition: max-height 0.2s ease, padding-bottom 0.2s ease;
}

.message.user .message-content {
  background: var(--primary-color, #FF6B00);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.bot .message-content {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.message-content.collapsed {
  max-height: 160px;
  overflow: hidden;
  cursor: pointer;
}

.message-content.collapsed::after {
  content: '…';
  position: absolute;
  bottom: 10px;
  right: 14px;
  font-weight: 700;
  color: inherit;
  background: transparent;
}

.message-content:focus-visible {
  outline: 2px solid var(--primary-color, #FF6B00);
  outline-offset: 2px;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  width: 100%;
}

.message-time {
  font-size: 11px;
  color: #999;
  padding: 0 4px;
}

.copy-button {
  border: none;
  background: transparent;
  color: #999;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  position: relative;
  padding: 0;
  transition: color 0.2s ease;
  margin-left: auto;
}

.copy-button i {
  font-size: 12px;
}

.copy-button:hover,
.copy-button:focus-visible {
  color: var(--primary-color, #FF6B00);
}

.copy-button:focus-visible {
  outline: 2px solid var(--primary-color, #FF6B00);
  outline-offset: 2px;
}

.copy-button::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
  z-index: 1;
}

.copy-button:hover::after,
.copy-button:focus-visible::after {
  opacity: 1;
}

.agentic-input-wrapper {
  display: flex;
  gap: 0;
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  flex-shrink: 0;
}

.input-container {
  flex: 1;
  display: flex;
  margin-right: 2px;
}

textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  min-height: 40px;
  max-height: none;
  overflow-y: hidden;
  background-color: var(--input-bg, #fff);
  color: var(--text-color, #333);
  box-sizing: border-box;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

textarea:focus {
  border-color: var(--primary-color, #FF6B00);
  box-shadow: 0 0 0 2px var(--primary-color-alpha, rgba(255, 107, 0, 0.1));
}

.controls-container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: 20px;
  min-height: 40px;
}

.scrollbar-placeholder {
  flex: 1;
  width: 100%;
  background: transparent;
  margin-bottom: 8px;
}

.send-button {
  width: 18px;
  height: 18px;
  border: none;
  background: var(--primary-color, #FF6B00);
  color: #fff;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  font-size: 0.75rem;
}

.send-button:hover:not(:disabled) {
  background: var(--primary-hover, #e55f00);
  
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.agentic-messages::-webkit-scrollbar,
textarea::-webkit-scrollbar {
  width: 6px;
}

.agentic-messages::-webkit-scrollbar-track,
textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.agentic-messages::-webkit-scrollbar-thumb,
textarea::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.agentic-messages::-webkit-scrollbar-thumb:hover,
textarea::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Loading indicator */
.message-content.loading {
  padding: 14px 18px;
  background: #f0f0f0;
  border-radius: 12px;
  border-bottom-left-radius: 4px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>
