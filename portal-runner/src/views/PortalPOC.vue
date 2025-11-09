<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { resolvePortal } from '@/services/portals'
import ButtonStandard from '@/components/ButtonStandard.vue'

const route = useRoute()
const portal = ref(null)
const loading = ref(true)
const err = ref('')

onMounted(async () => {
  try {
    portal.value = await resolvePortal(route.params.portalCode)
    
    if (!portal.value?.is_active) {
      err.value = 'Portail désactivé'
    }
  } catch (e) {
    console.error('Error resolving portal:', e)
    err.value = e?.response?.data?.message || 'Portail introuvable'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="container">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Chargement du portail…</p>
    </div>
    
    <div v-else-if="err" class="error-box">
      <h2>❌ Erreur</h2>
      <p>{{ err }}</p>
    </div>
    
    <div v-else class="portal-content">
      <h1>Hello world — {{ portal.name }}</h1>
      <div class="portal-info">
        <p><strong>Code:</strong> {{ portal.code }}</p>
        <p><strong>URL de base:</strong> {{ portal.base_url }}</p>
        <p v-if="portal.actions && portal.actions.length > 0">
          <strong>Actions disponibles:</strong> {{ portal.actions.length }}
        </p>
      </div>
      
      <div v-if="portal.actions && portal.actions.length > 0" class="actions-section">
        <h2>Action de test</h2>
        <p class="action-description">
          Cette action exécute : <code>{{ portal.actions[0].http_method }} {{ portal.actions[0].endpoint }}</code>
        </p>
        <ButtonStandard :action="portal.actions[0]" />
      </div>
      
      <div v-else class="no-actions">
        <p>⚠️ Aucune action configurée pour ce portail</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 40px auto;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 40px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #111;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-box {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
}

.error-box h2 {
  margin-top: 0;
  font-size: 24px;
}

.portal-content h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111;
  margin-bottom: 20px;
}

.portal-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.portal-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #555;
}

.portal-info strong {
  color: #111;
}

.actions-section {
  margin-top: 32px;
}

.actions-section h2 {
  font-size: 24px;
  margin-bottom: 12px;
  color: #111;
}

.action-description {
  font-size: 14px;
  color: #777;
  margin-bottom: 16px;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #d63384;
}

.no-actions {
  margin-top: 32px;
  padding: 20px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  text-align: center;
}

.no-actions p {
  margin: 0;
  color: #856404;
  font-size: 16px;
}
</style>
