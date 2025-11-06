<template>
  <div class="agentic-panel">
    <div class="agentic-header">
      <i class="fas fa-robot"></i>
      <span>Agent Lumière</span>
    </div>
    
    <div class="agentic-messages" ref="messagesContainer">
      <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
        <div class="message-content">{{ message.text }}</div>
        <div class="message-time">{{ message.time }}</div>
      </div>
    </div>
    
    <div class="agentic-input-wrapper">
      <div class="input-container">
        <textarea
          v-model="inputText"
          @keydown.enter.exact.prevent="sendMessage"
          @input="adjustTextareaHeight"
          ref="textarea"
          placeholder="Tapez votre message..."
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

const props = defineProps({
  defaultMessage: {
    type: String,
    default: 'En cours d\'implémentation'
  }
})

const messages = ref([])
const inputText = ref('')
const messagesContainer = ref(null)
const textarea = ref(null)
const textareaHeight = ref('auto')

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

const adjustTextareaHeight = () => {
  const el = textarea.value
  if (!el) return
  
  // Reset height to auto to get the correct scrollHeight
  el.style.height = 'auto'
  
  // Calculate new height (max 25% of viewport height)
  const maxHeight = window.innerHeight * 0.25
  const newHeight = Math.min(el.scrollHeight, maxHeight)
  
  textareaHeight.value = `${newHeight}px`
}

const sendMessage = () => {
  if (!inputText.value.trim()) return
  
  // Add user message
  messages.value.push({
    type: 'user',
    text: inputText.value.trim(),
    time: formatTime()
  })
  
  inputText.value = ''
  textareaHeight.value = 'auto'
  scrollToBottom()
  
  // Simulate bot response
  setTimeout(() => {
    messages.value.push({
      type: 'bot',
      text: props.defaultMessage,
      time: formatTime()
    })
    scrollToBottom()
  }, 500)
}

onMounted(() => {
  // Welcome message
  messages.value.push({
    type: 'bot',
    text: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    time: formatTime()
  })
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

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

.message.user .message-time {
  text-align: right;
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
  padding: 0;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  min-height: 40px;
  max-height: 25vh;
  overflow-y: auto;
  background-color: var(--input-bg, #fff);
  color: var(--text-color, #333);
  box-sizing: border-box;
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
</style>
