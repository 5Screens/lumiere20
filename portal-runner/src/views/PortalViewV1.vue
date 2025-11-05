<template>
  <div class="portal-v1" :style="themeStyles">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Chargement du portail…</p>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>❌ Erreur</h2>
      <p>{{ error }}</p>
    </div>
    
    <!-- Portal Content -->
    <div v-else class="portal-container">
      <!-- Header -->
      <header class="portal-header">
        <div class="header-left">
          <img v-if="portal.logo_url" :src="portal.logo_url" alt="Logo" class="portal-logo" />
          <div class="portal-branding">
            <h1 class="portal-title">{{ portal.title }}</h1>
            <p class="portal-subtitle">{{ portal.subtitle }}</p>
          </div>
        </div>
        <div class="header-right">
          <button class="icon-button" title="SSO">
            <i class="fas fa-key"></i>
          </button>
          <button class="icon-button" title="Profil">
            <i class="fas fa-user-circle"></i>
          </button>
          <span class="user-name">John Doe</span>
        </div>
      </header>
      
      <!-- Main Content Area -->
      <div class="main-content">
        <!-- Left: Main Area (75%) -->
        <div class="content-left">
          <!-- Alerts -->
          <div v-if="portal.show_alerts && portal.alerts && portal.alerts.length > 0" class="alerts-section">
            <AlertBanner v-for="alert in portal.alerts" :key="alert.uuid" :alert="alert" />
          </div>
          
          <!-- Welcome Message -->
          <div class="welcome-section">
            <h2>{{ welcomeMessage }}</h2>
          </div>
          
          <!-- Quick Actions -->
          <section class="section">
            <h3 class="section-title">Actions rapides</h3>
            <div class="quick-actions-grid">
              <QuickActionCard
                v-for="action in portal.quick_actions"
                :key="action.uuid"
                :action="action"
                @success="handleActionSuccess"
                @error="handleActionError"
              />
            </div>
          </section>
          
          <!-- Dashboard Widgets -->
          <section v-if="portal.widgets && portal.widgets.length > 0" class="section">
            <h3 class="section-title">Ce qui vous attend aujourd'hui</h3>
            <div class="widgets-grid">
              <DashboardWidget
                v-for="widget in portal.widgets"
                :key="widget.uuid"
                :widget="widget"
              />
            </div>
          </section>
        </div>
        
        <!-- Right: Chat Panel (25%) -->
        <div v-if="portal.show_chat" class="content-right">
          <ChatPanel :default-message="portal.chat_default_message" />
        </div>
      </div>
      
      <!-- Footer -->
      <footer class="portal-footer">
        <p>© 2025 Lumière 16 - Tous droits réservés</p>
      </footer>
    </div>
    
    <!-- Success/Error Toast -->
    <div v-if="toast.show" :class="['toast', toast.type]">
      <i :class="toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getFullPortal } from '@/services/portals'
import AlertBanner from '@/components/AlertBanner.vue'
import QuickActionCard from '@/components/QuickActionCard.vue'
import DashboardWidget from '@/components/DashboardWidget.vue'
import ChatPanel from '@/components/ChatPanel.vue'

const route = useRoute()
const portal = ref(null)
const loading = ref(true)
const error = ref('')
const toast = ref({ show: false, type: 'success', message: '' })

const themeStyles = computed(() => {
  if (!portal.value) return {}
  return {
    '--primary-color': portal.value.theme_primary_color || '#FF6B00',
    '--secondary-color': portal.value.theme_secondary_color || '#111111'
  }
})

const welcomeMessage = computed(() => {
  if (!portal.value || !portal.value.welcome_template) return 'Bienvenue !'
  
  // Replace {firstName} with actual user name (hardcoded for POC)
  return portal.value.welcome_template.replace('{firstName}', 'John')
})

const showToast = (type, message) => {
  toast.value = { show: true, type, message }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const handleActionSuccess = (data) => {
  console.log('Action success:', data)
  showToast('success', 'Action exécutée avec succès !')
}

const handleActionError = (err) => {
  console.error('Action error:', err)
  showToast('error', 'Erreur lors de l\'exécution de l\'action')
}

onMounted(async () => {
  try {
    const portalCode = route.params.portalCode
    portal.value = await getFullPortal(portalCode)
    
    if (!portal.value.is_active) {
      error.value = 'Portail désactivé'
    }
  } catch (e) {
    console.error('Error loading portal:', e)
    error.value = e?.response?.data?.message || 'Portail introuvable'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.portal-v1 {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

/* Loading & Error States */
.loading-container,
.error-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid var(--primary-color, #FF6B00);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  color: #d32f2f;
}

/* Portal Container */
.portal-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.portal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portal-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.portal-branding {
  display: flex;
  flex-direction: column;
}

.portal-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--secondary-color, #111);
  margin: 0;
  line-height: 1.2;
}

.portal-subtitle {
  font-size: 14px;
  color: #666;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-button {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  color: var(--secondary-color, #111);
  font-size: 20px;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s;
}

.icon-button:hover {
  background: #f0f0f0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--secondary-color, #111);
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  gap: 0;
}

.content-left {
  flex: 0 0 75%;
  padding: 24px 32px;
  overflow-y: auto;
}

.content-right {
  flex: 0 0 25%;
  background: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Sections */
.alerts-section {
  margin-bottom: 24px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h2 {
  font-size: 28px;
  font-weight: 600;
  color: var(--secondary-color, #111);
  margin: 0;
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--secondary-color, #111);
  margin: 0 0 20px 0;
}

/* Grids */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.widgets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

/* Footer */
.portal-footer {
  padding: 16px 32px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  flex-shrink: 0;
}

.portal-footer p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

/* Toast Notification */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  font-weight: 500;
  animation: slideInUp 0.3s ease;
  z-index: 1000;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast.success {
  border-left: 4px solid #4caf50;
  color: #2e7d32;
}

.toast.error {
  border-left: 4px solid #f44336;
  color: #c62828;
}

.toast i {
  font-size: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .main-content {
    flex-direction: column-reverse;
  }
  
  .content-left {
    flex: 1;
  }
  
  .content-right {
    flex: 0 0 300px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr;
  }
  
  .widgets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
