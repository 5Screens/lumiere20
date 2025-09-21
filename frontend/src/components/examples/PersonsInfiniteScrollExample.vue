<template>
  <div class="persons-infinite-scroll-example">
    <h2>Exemple de Scroll Infini - Personnes</h2>
    <p>Ce composant démontre l'utilisation du scroll infini avec l'API des personnes.</p>
    
    <!-- Tableau avec scroll infini activé -->
    <ReusableTableTab
      :apiUrl="apiUrl"
      :columns="columns"
      :selectable="true"
      :filterable="true"
      :paginated="false"
      :infiniteScrollEnabled="true"
      :pageSize="50"
      @row-selected="handleRowSelection"
      @error="handleError"
    />
    
    <!-- Message d'erreur -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import ReusableTableTab from '@/components/common/reusableTableTab.vue'

export default {
  name: 'PersonsInfiniteScrollExample',
  components: {
    ReusableTableTab
  },
  data() {
    return {
      apiUrl: '/api/v1/persons',
      errorMessage: null,
      columns: [
        {
          key: 'person_name',
          label: 'Nom complet',
          type: 'text',
          format: null
        },
        {
          key: 'email',
          label: 'Email',
          type: 'text',
          format: null
        },
        {
          key: 'job_role',
          label: 'Poste',
          type: 'text',
          format: null
        },
        {
          key: 'ref_entity_name',
          label: 'Entité',
          type: 'text',
          format: null
        },
        {
          key: 'ref_location_name',
          label: 'Localisation',
          type: 'text',
          format: null
        },
        {
          key: 'active',
          label: 'Actif',
          type: 'boolean',
          format: null
        },
        {
          key: 'raised_tickets_count',
          label: 'Tickets créés',
          type: 'number',
          format: null
        },
        {
          key: 'assigned_tickets_count',
          label: 'Tickets assignés',
          type: 'number',
          format: null
        },
        {
          key: 'watched_tickets_count',
          label: 'Tickets observés',
          type: 'number',
          format: null
        },
        {
          key: 'updated_at',
          label: 'Dernière mise à jour',
          type: 'date',
          format: 'YYYY-MM-DD'
        }
      ]
    }
  },
  methods: {
    handleRowSelection() {
      console.log('[PersonsInfiniteScrollExample] Row selection changed');
    },
    
    handleError(error) {
      console.error('[PersonsInfiniteScrollExample] Error:', error);
      this.errorMessage = error;
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        this.errorMessage = null;
      }, 5000);
    }
  }
}
</script>

<style scoped>
.persons-infinite-scroll-example {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.persons-infinite-scroll-example h2 {
  margin-bottom: 10px;
  color: var(--text-color);
}

.persons-infinite-scroll-example p {
  margin-bottom: 20px;
  color: var(--text-color);
  opacity: 0.8;
}

.error-message {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-width: 300px;
}

.error-message i {
  margin-right: 8px;
}
</style>
