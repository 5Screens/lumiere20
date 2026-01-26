<template>
  <div class="portal-v2 h-dvh overflow-hidden flex flex-col bg-surface-0 dark:bg-surface-900" :style="themeStyles">
    <!-- Mobile Bottom Navigation -->
    <nav v-if="isMobile" class="fixed bottom-0 left-0 right-0 z-50 bg-surface-0 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 flex items-center justify-around py-3 px-4">
      <button 
        @click="mobileView = 'home'"
        class="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors"
        :class="mobileView === 'home' ? 'text-primary bg-primary/10' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'"
      >
        <i class="pi pi-home text-xl"></i>
        <span class="text-xs font-medium">{{ $t('portal.home') }}</span>
      </button>
      <button 
        @click="mobileView = 'chat'"
        class="flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors"
        :class="mobileView === 'chat' ? 'text-primary bg-primary/10' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'"
      >
        <i class="pi pi-microchip-ai text-xl"></i>
        <span class="text-xs font-medium">{{ $t('chat.title') }}</span>
      </button>
    </nav>
    <!-- Header -->
    <header class="bg-surface-0 dark:bg-surface-800 shadow-sm border-b border-surface-200 dark:border-surface-700">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <img v-if="portal.logo_url" :src="portal.logo_url" alt="Logo" class="h-10" />
          <div>
            <h1 class="text-xl font-semibold text-surface-800 dark:text-surface-100">{{ portal.title }}</h1>
            <p v-if="portal.subtitle" class="text-sm text-surface-500">{{ portal.subtitle }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <Button icon="pi pi-language" text rounded @click="toggleLanguageMenu" v-tooltip="'Language'" />
          <Menu ref="langMenu" :model="languageItems" :popup="true" />
          
          <!-- Theme toggle -->
          <Button 
            :icon="theme === 'light' ? 'pi pi-moon' : 'pi pi-sun'" 
            text 
            rounded
            @click="toggleTheme"
            v-tooltip="theme === 'light' ? 'Dark mode' : 'Light mode'"
          />
          
          <!-- User info -->
          <div class="flex items-center gap-3">
            <div class="text-right hidden sm:block">
              <p class="text-sm font-medium text-surface-800 dark:text-surface-100">{{ authStore.fullName }}</p>
              <p class="text-xs text-surface-500">{{ authStore.userEmail }}</p>
            </div>
            <Button icon="pi pi-user" text rounded @click="toggleUserMenu" v-tooltip="authStore.fullName" />
            <Menu ref="userMenu" :model="userMenuItems" :popup="true" />
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="flex-1 flex min-h-0" :class="{ 'pb-20': isMobile }">
      <!-- Left: Main Area (hidden on mobile when chat is active) -->
      <div 
        v-show="!isMobile || mobileView === 'home'"
        class="flex-1 min-h-0 p-6 overflow-y-auto"
        :class="{ 'w-full': isMobile }"
      >
        <!-- Alerts -->
        <div v-if="portal.show_alerts && alerts.length > 0" class="mb-6 space-y-3">
          <Message 
            v-for="alert in alerts" 
            :key="alert.uuid" 
            :severity="alert.severity || 'info'"
            :closable="false"
          >
            <template #icon>
              <i :class="alert.icon || 'pi pi-info-circle'"></i>
            </template>
            {{ alert.message }}
          </Message>
        </div>
        
        <!-- Welcome -->
        <div class="mb-8">
          <h2 class="text-2xl font-semibold text-surface-800 dark:text-surface-100">
            {{ $t('portal.welcome') }}, {{ userName }}
          </h2>
        </div>
        
        <!-- Quick Actions -->
        <section v-if="portal.show_actions && quickActions.length > 0" class="mb-8">
          <h3 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-4">
            {{ $t('portal.quickActions') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card 
              v-for="action in quickActions" 
              :key="action.uuid"
              class="cursor-pointer hover:shadow-md transition-shadow"
              @click="handleAction(action)"
            >
              <template #content>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <i :class="[action.icon || 'pi pi-bolt', 'text-xl text-primary']"></i>
                  </div>
                  <div>
                    <h4 class="font-medium text-surface-800 dark:text-surface-100">{{ action.label }}</h4>
                    <p v-if="action.description" class="text-sm text-surface-500">{{ action.description }}</p>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </section>
        
        <!-- Widgets -->
        <section v-if="portal.show_widgets && widgets.length > 0">
          <h3 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-4">
            {{ $t('portal.widgets') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card v-for="widget in widgets" :key="widget.uuid">
              <template #title>
                <div class="flex items-center gap-2">
                  <i :class="[widget.icon || 'pi pi-chart-bar', 'text-primary']"></i>
                  {{ widget.title }}
                </div>
              </template>
              <template #content>
                <p class="text-surface-600 dark:text-surface-400">{{ widget.description }}</p>
              </template>
            </Card>
          </div>
        </section>
      </div>
      
      <!-- Right: Agentic Panel -->
      <template v-if="portal.show_chat">
        <!-- Resizer (hidden on mobile) -->
        <div
          v-if="!isMobile"
          class="w-2 cursor-col-resize select-none bg-surface-200 dark:bg-surface-700 hover:bg-primary/70 active:bg-primary/80 transition-colors"
          @mousedown="onChatResizerMouseDown"
          @dblclick="resetChatWidth"
        ></div>
        <aside
          v-show="!isMobile || mobileView === 'chat'"
          class="min-h-0 flex flex-col overflow-hidden border-l border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-800"
          :class="{ 'w-full border-l-0': isMobile }"
          :style="isMobile ? {} : chatAsideStyle"
        >
          <!-- Conversation Header -->
          <div class="p-3 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <i class="pi pi-microchip-ai text-primary"></i>
              <span class="font-semibold text-surface-800 dark:text-surface-100">{{ $t('chat.title') }}</span>
            </div>
            <div class="flex items-center gap-1">
              <!-- New conversation button -->
              <Button 
                icon="pi pi-plus" 
                text 
                rounded 
                size="small"
                v-tooltip.bottom="$t('chat.newConversation')"
                @click="startNewConversation"
              />
              <Select
                v-model="selectedConversationId"
                :options="conversationsOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="$t('chat.selectConversation')"
                :loading="loadingConversations"
                dropdownIcon="pi pi-history"
                class="w-36 sm:w-48"
                overlayClass="max-w-[90vw]"
                size="small"
                @change="onConversationSelect"
                @show="loadConversations"
              >
                <template #value="slotProps">
                  <span v-if="slotProps.value" class="text-sm truncate">
                    {{ getConversationLabel(slotProps.value) }}
                  </span>
                  <span v-else class="text-sm text-surface-400">{{ $t('chat.selectConversation') }}</span>
                </template>
                <template #option="slotProps">
                  <div class="flex items-center justify-between w-full gap-2">
                    <div class="flex flex-col flex-1 min-w-0" v-tooltip.top="slotProps.option.label">
                      <span class="text-sm truncate">{{ slotProps.option.label }}</span>
                      <span class="text-xs text-surface-400">{{ slotProps.option.date }}</span>
                    </div>
                    <div class="flex items-center gap-1" @click.stop @mousedown.stop>
                      <!-- Delete mode: show red trash + cancel -->
                      <template v-if="deletingConversationId === slotProps.option.value">
                        <i 
                          class="pi pi-trash text-red-500 cursor-pointer hover:text-red-700 p-1"
                          @click="confirmDeleteConversation(slotProps.option.value)"
                          v-tooltip.top="$t('chat.confirmDelete')"
                        ></i>
                        <i 
                          class="pi pi-times text-surface-400 cursor-pointer hover:text-surface-600 p-1"
                          @click="cancelDeleteConversation"
                          v-tooltip.top="$t('chat.cancel')"
                        ></i>
                      </template>
                      <!-- Normal mode: show edit + trash -->
                      <template v-else>
                        <i 
                          class="pi pi-pencil text-surface-400 cursor-pointer hover:text-primary p-1"
                          @click="startEditConversation(slotProps.option.value)"
                          v-tooltip.top="$t('chat.rename')"
                        ></i>
                        <i 
                          class="pi pi-trash text-surface-400 cursor-pointer hover:text-red-500 p-1"
                          @click="startDeleteConversation(slotProps.option.value)"
                          v-tooltip.top="$t('chat.delete')"
                        ></i>
                      </template>
                    </div>
                  </div>
                </template>
                <template #empty>
                  <span class="text-sm text-surface-400 p-2">{{ $t('chat.noConversations') }}</span>
                </template>
              </Select>
            </div>
          </div>
          <AgenticPanel 
            ref="agenticPanelRef"
            class="flex-1 min-h-0" 
            :default-message="portal.chat_default_message"
            :conversation-id="selectedConversationId"
            @update:conversation-id="onConversationIdUpdate"
            @open-ocr="openOcrDrawer"
            @open-documents="openDocumentsDrawer"
          />
        </aside>
      </template>
    </main>
    
    <!-- Footer (hidden on mobile) -->
    <footer v-if="!isMobile" class="bg-surface-0 dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 py-4 text-center">
      <p class="text-sm text-surface-500">{{ $t('portal.footer') }}</p>
    </footer>
    
    <!-- OCR Drawer -->
    <OcrDrawer 
      v-model:show="showOcrDrawer"
      @ocr-complete="onOcrComplete"
    />
    
    <!-- Documents Drawer -->
    <DocumentsDrawer 
      ref="documentsDrawerRef"
      v-model:show="showDocumentsDrawer"
    />
    
    <!-- Rename Conversation Dialog -->
    <Dialog 
      v-model:visible="showRenameDialog" 
      :header="$t('chat.renameConversation')"
      :modal="true"
      :closable="true"
      :style="{ width: '400px' }"
      @hide="cancelRenameConversation"
    >
      <div class="flex flex-col gap-4">
        <InputText 
          v-model="renameTitle" 
          :placeholder="$t('chat.conversationTitle')"
          class="w-full"
          @keyup.enter="confirmRenameConversation"
          autofocus
        />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button 
            :label="$t('common.cancel')" 
            severity="secondary" 
            text 
            @click="cancelRenameConversation" 
          />
          <Button 
            :label="$t('common.save')" 
            @click="confirmRenameConversation" 
            :disabled="!renameTitle.trim()"
          />
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import { useResponsiveSize } from '@/composables/useResponsiveSize'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Menu from 'primevue/menu'
import Select from 'primevue/select'
import AgenticPanel from '@/components/AgenticPanel.vue'
import OcrDrawer from '@/components/OcrDrawer.vue'
import DocumentsDrawer from '@/components/DocumentsDrawer.vue'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { getConversations, deleteConversation, renameConversation, sendMessage as sendAgentMessage } from '@/services/agent'

const props = defineProps({
  portalData: { type: Object, required: true },
  portalCode: { type: String, required: true }
})

const router = useRouter()
const { locale, t } = useI18n()
const authStore = useAuthStore()
const { isMobile } = useResponsiveSize()
const langMenu = ref()
const userMenu = ref()
const agenticPanelRef = ref(null)

// Mobile view state: 'home' or 'chat'
const mobileView = ref('home')

// OCR and Documents drawers
const showOcrDrawer = ref(false)
const showDocumentsDrawer = ref(false)
const documentsDrawerRef = ref(null)

// Conversations management
const conversations = ref([])
const selectedConversationId = ref(null)
const loadingConversations = ref(false)
const deletingConversationId = ref(null)

// Rename conversation
const showRenameDialog = ref(false)
const renamingConversationId = ref(null)
const renameTitle = ref('')

const conversationsOptions = computed(() => {
  return conversations.value.map(conv => ({
    value: conv.uuid,
    label: conv.title || t('chat.newConversation'),
    date: new Date(conv.updated_at).toLocaleDateString(locale.value, { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }))
})

const getConversationLabel = (uuid) => {
  const conv = conversations.value.find(c => c.uuid === uuid)
  return conv?.title || t('chat.newConversation')
}

const loadConversations = async () => {
  if (loadingConversations.value) return
  loadingConversations.value = true
  try {
    conversations.value = await getConversations(20)
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loadingConversations.value = false
  }
}

const onConversationSelect = (event) => {
  // The Select component already updates selectedConversationId via v-model
  // AgenticPanel will react to the prop change
}

const onConversationIdUpdate = (newId) => {
  selectedConversationId.value = newId
  // Refresh conversations list to include the new one
  if (newId) {
    loadConversations()
  }
}

const startNewConversation = () => {
  selectedConversationId.value = null
  if (agenticPanelRef.value) {
    agenticPanelRef.value.startNewConversation()
  }
}

// Delete conversation functions
const startDeleteConversation = (convId) => {
  deletingConversationId.value = convId
}

const cancelDeleteConversation = () => {
  deletingConversationId.value = null
}

const confirmDeleteConversation = async (convId) => {
  try {
    await deleteConversation(convId)
    // Remove from local list
    conversations.value = conversations.value.filter(c => c.uuid !== convId)
    // If deleted conversation was selected, start new one
    if (selectedConversationId.value === convId) {
      startNewConversation()
    }
    deletingConversationId.value = null
  } catch (error) {
    console.error('Failed to delete conversation:', error)
  }
}

// Edit/Rename conversation
const startEditConversation = (convId) => {
  const conv = conversations.value.find(c => c.uuid === convId)
  renamingConversationId.value = convId
  renameTitle.value = conv?.title || ''
  showRenameDialog.value = true
}

const confirmRenameConversation = async () => {
  if (!renamingConversationId.value || !renameTitle.value.trim()) return
  
  try {
    await renameConversation(renamingConversationId.value, renameTitle.value.trim())
    // Update local list
    const conv = conversations.value.find(c => c.uuid === renamingConversationId.value)
    if (conv) {
      conv.title = renameTitle.value.trim()
    }
    showRenameDialog.value = false
    renamingConversationId.value = null
    renameTitle.value = ''
  } catch (error) {
    console.error('Failed to rename conversation:', error)
  }
}

const cancelRenameConversation = () => {
  showRenameDialog.value = false
  renamingConversationId.value = null
  renameTitle.value = ''
}


const portal = computed(() => props.portalData || {})
const alerts = computed(() => portal.value.alerts || [])
const quickActions = computed(() => portal.value.quick_actions || [])
const widgets = computed(() => portal.value.widgets || [])
const userName = computed(() => authStore.user?.first_name || 'User')

const CHAT_WIDTH_STORAGE_KEY = 'portal_runner_v2_chat_width'
const chatWidth = ref(Number(localStorage.getItem(CHAT_WIDTH_STORAGE_KEY)) || 384)
const chatDefaultWidth = 384
const chatMinWidth = 320
const chatMaxWidth = 720
const isResizingChat = ref(false)
const resizeHandlers = ref({ onMouseMove: null, onMouseUp: null })

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const chatAsideStyle = computed(() => ({
  width: `${chatWidth.value}px`
}))

const onChatResizerMouseDown = (event) => {
  event.preventDefault()

  isResizingChat.value = true
  const startX = event.clientX
  const startWidth = chatWidth.value

  const onMouseMove = (moveEvent) => {
    const delta = startX - moveEvent.clientX
    chatWidth.value = clamp(startWidth + delta, chatMinWidth, chatMaxWidth)
  }

  const onMouseUp = () => {
    isResizingChat.value = false
    localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(chatWidth.value))
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
    resizeHandlers.value = { onMouseMove: null, onMouseUp: null }
  }

  resizeHandlers.value = { onMouseMove, onMouseUp }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

const resetChatWidth = () => {
  chatWidth.value = chatDefaultWidth
  localStorage.setItem(CHAT_WIDTH_STORAGE_KEY, String(chatWidth.value))
}

onBeforeUnmount(() => {
  if (resizeHandlers.value.onMouseMove) {
    window.removeEventListener('mousemove', resizeHandlers.value.onMouseMove)
  }
  if (resizeHandlers.value.onMouseUp) {
    window.removeEventListener('mouseup', resizeHandlers.value.onMouseUp)
  }
})

const themeStyles = computed(() => ({
  '--portal-primary': portal.value.theme_primary_color || '#FF6B00',
  '--portal-secondary': portal.value.theme_secondary_color || '#1a1a2e'
}))

const languageItems = ref([
  { label: 'Français', icon: 'pi pi-flag', command: () => changeLanguage('fr') },
  { label: 'English', icon: 'pi pi-flag', command: () => changeLanguage('en') }
])

// App version from build
const appVersion = __APP_VERSION__ || '0.0.0'

const userMenuItems = computed(() => [
  { 
    label: authStore.fullName, 
    icon: 'pi pi-user',
    disabled: true,
    class: 'font-semibold'
  },
  { separator: true },
  { 
    label: t('auth.logout'), 
    icon: 'pi pi-sign-out', 
    command: handleLogout 
  },
  { separator: true },
  { 
    label: `v${appVersion}`, 
    icon: 'pi pi-info-circle',
    disabled: true,
    class: 'text-xs text-surface-400'
  }
])

const toggleUserMenu = (event) => {
  userMenu.value.toggle(event)
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const toggleLanguageMenu = (event) => {
  langMenu.value.toggle(event)
}

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

// Theme
const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

// Initialize theme on mount
onMounted(() => {
  loadConversations()
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', theme.value)
})

const handleAction = (action) => {
  console.log('Action clicked:', action)
  
  // Handle specific action codes
  const actionCode = action.code || action.action
  
  switch (actionCode) {
    case 'ocr':
    case 'scan_document':
      openOcrDrawer()
      break
    case 'my_documents':
    case 'documents':
      openDocumentsDrawer()
      break
    case 'my_tickets':
    case 'tickets':
      // TODO: Navigate to tickets view or open tickets drawer
      console.log('Open my tickets')
      break
    default:
      // For other actions, send to chat
      if (action.message) {
        // Send message to agent
        console.log('Sending action message to agent:', action.message)
      }
  }
}

/**
 * Open OCR drawer
 */
const openOcrDrawer = () => {
  // Start a new conversation for OCR workflow
  startNewConversation()
  showOcrDrawer.value = true
}

/**
 * Open Documents drawer
 */
const openDocumentsDrawer = () => {
  showDocumentsDrawer.value = true
}

/**
 * Handle OCR completion - send message to chat
 */
const onOcrComplete = async (data) => {
  console.log('OCR complete:', data)
  
  // Refresh documents drawer if open
  if (documentsDrawerRef.value) {
    documentsDrawerRef.value.refresh()
  }
  
  // Send message to agent with the scanned document content
  // Include the markdown so the agent has context for follow-up questions
  const message = `[OCR] ${t('ocr.documentScanned')}: ${data.fileName}\n\n${data.markdown}`
  
  try {
    const response = await sendAgentMessage(message, selectedConversationId.value, 'text')
    
    // Update conversation ID if new
    if (response.conversationId) {
      selectedConversationId.value = response.conversationId
      loadConversations()
    }
    
    // Reload the conversation in the panel to show the new message
    if (agenticPanelRef.value && response.conversationId) {
      agenticPanelRef.value.loadConversation(response.conversationId)
    }
  } catch (error) {
    console.error('Failed to send OCR message to agent:', error)
  }
}
</script>
