<template>
  <div class="portal-v2 h-screen overflow-hidden flex flex-col" :style="themeStyles">
    <!-- Header -->
    <header class="bg-white dark:bg-surface-800 shadow-sm border-b border-surface-200 dark:border-surface-700">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <img v-if="portal.logo_url" :src="portal.logo_url" alt="Logo" class="h-10" />
          <div>
            <h1 class="text-xl font-semibold text-surface-800 dark:text-surface-100">{{ portal.title }}</h1>
            <p v-if="portal.subtitle" class="text-sm text-surface-500">{{ portal.subtitle }}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <Button icon="pi pi-globe" text rounded @click="toggleLanguageMenu" v-tooltip="'Language'" />
          <Menu ref="langMenu" :model="languageItems" :popup="true" />
          
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
    <main class="flex-1 flex min-h-0">
      <!-- Left: Main Area -->
      <div class="flex-1 min-h-0 p-6 overflow-y-auto">
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
        <div
          class="w-2 cursor-col-resize select-none bg-surface-200 dark:bg-surface-700 hover:bg-primary/70 active:bg-primary/80 transition-colors"
          @mousedown="onChatResizerMouseDown"
          @dblclick="resetChatWidth"
        ></div>
        <aside
          class="min-h-0 flex flex-col overflow-hidden border-l border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
          :style="chatAsideStyle"
        >
          <AgenticPanel class="flex-1 min-h-0" :default-message="portal.chat_default_message" />
        </aside>
      </template>
    </main>
    
    <!-- Footer -->
    <footer class="bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 py-4 text-center">
      <p class="text-sm text-surface-500">{{ $t('portal.footer') }}</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Message from 'primevue/message'
import Menu from 'primevue/menu'
import AgenticPanel from '@/components/AgenticPanel.vue'

const props = defineProps({
  portalData: { type: Object, required: true },
  portalCode: { type: String, required: true }
})

const router = useRouter()
const { locale, t } = useI18n()
const authStore = useAuthStore()
const langMenu = ref()
const userMenu = ref()

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

const handleAction = (action) => {
  console.log('Action clicked:', action)
  // TODO: Implement action handling
}
</script>
