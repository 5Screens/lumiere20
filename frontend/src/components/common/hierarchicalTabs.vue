<template>
  <div class="hierarchical-tabs">
    <!-- Onglets principaux (niveau 1) -->
    <div class="tabs-container primary-tabs">
      <div 
        v-for="tab in store.parentTabs" 
        :key="tab.id_tab" 
        class="tab primary-tab" 
        :class="{ 
          active: store.isParentTabActive(tab.id_tab),
          'has-active-child': store.activeTabId === tab.id_tab && store.activeChildTabId !== null 
        }"
        @click="handleTabSwitch(tab)"
      >
        <i v-if="tab.icon" :class="tab.icon"></i>
        <span class="tab-title">{{ $t(tab.label) }}</span>
        <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
      </div>
    </div>
    
    <!-- Onglets secondaires (niveau 2) si un onglet parent est actif -->
    <div v-if="store.activeChildTabs.length > 0" class="tabs-container secondary-tabs">
      <div>
        <!-- Onglet fixe de retour à la table de l'onglet parent actif si au moins un onglet secondaire actif est ouvert -->
        <div
          v-if="store.activeTab"
          class="tab secondary-tab"
          :class="{
            active: store.isParentTabActive(store.activeTab.id_tab)
          }"
          @click="handleTabSwitch(store.activeTab)"
        >
          <div class="secondary-tab-main">
            <div class="secondary-tab-head">
              <i v-if="store.activeTab.icon" class="fas fa-table"></i>
              <span class="tab-title">{{ $t('common.tableFilters') }}</span>
            </div>
            <div class="secondary-tab-body">
              <span class="tab-info">{{ $t('common.backToMain') }}</span>
              <!-- Affichage des filtres actifs sous forme de badges -->
              <span
                v-for="(filter, index) in activeFilters"
                :key="index"
                class="tab-info level-badge"
                :title="getFilterLabel(filter) + ': ' + formatFilterValue(filter)"
              >
                {{ getFilterLabel(filter) }}: {{ formatFilterValue(filter) }}
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Onglets secondaires (niveau 2) -->
      <div
        v-for="tab in store.activeChildTabs"
        :key="tab.id_tab"
        class="tab secondary-tab"
        :class="{ active: store.activeChildTabId === tab.id_tab }"
        @click="handleChildTabSwitch(tab)"
      >
        <div class="secondary-tab-main">
          <div class="secondary-tab-head">
            <i v-if="tab.icon" :class="tab.icon"></i>
            <span class="tab-title" :title="tab.label">
              {{ tab.label && tab.label.length > 15 ? tab.label.substring(0, 15) + '...' : (tab.label || 'Sans titre') }}
            </span>
            <button class="close-tab" @click.stop="store.closeTab(tab.id_tab)">×</button>
          </div>
          <div class="secondary-tab-body">
            <!-- ID -->
            <span class="tab-info" v-if="tab.objectId" :title="tab.objectId">
              {{ $t('common.id') }}: {{ tab.objectId }}
            </span>
            <span class="tab-info" v-else>
              {{ tab.label }}
            </span>

            <!-- Statut -->
            <span class="tab-info" v-if="tab.ticketStatus" :class="'status-badge status-' + getStatusClass(tab.ticketStatus)">
              {{ tab.ticketStatusLabel || formatStatus(tab.ticketStatus) }}
            </span>

            <!-- Informations spécifiques INCIDENT -->
            <template v-if="tab.ticketType === 'INCIDENT'">
              <span class="tab-info level-badge"
                    v-if="tab.priority"
                    :class="getLevelBadge(tab.priority).class"
                    :title="$t('common.priority') + ': ' + tab.priority">
                {{ $t('common.priority') }} : {{ getLevelBadge(tab.priority).emoji }} {{ getLevelBadge(tab.priority).label }}
              </span>
              <span class="tab-info level-badge"
                    v-if="tab.impact"
                    :title="$t('common.impact') + ': ' + (tab.impactLabel || tab.impact)">
                {{ $t('common.impact') }} : {{ getLevelBadge(tab.impact).emoji }} {{ tab.impactLabel || tab.impact }}
              </span>
              <span class="tab-info level-badge"
                    v-if="tab.urgency"
                    :title="$t('common.urgency') + ': ' + (tab.urgencyLabel || tab.urgency)">
                {{ $t('common.urgency') }} : {{ getLevelBadge(tab.urgency).emoji }} {{ tab.urgencyLabel || tab.urgency }}
              </span>
              <span class="tab-info" v-if="tab.writerName">{{ $t('common.createdBy') }}: {{ tab.writerName }}</span>
              <span class="tab-info" v-if="tab.updatedAt">
                {{ $t('common.modified') }} : {{ formatDate(tab.updatedAt) }}
              </span>
              <span class="tab-info" v-else-if="tab.createdAt">
                {{ $t('common.created') }} : {{ formatDate(tab.createdAt) }}
              </span>
            </template>

            <!-- Informations spécifiques PROBLEM -->
            <template v-else-if="tab.ticketType === 'PROBLEM'">
              <span class="tab-info" v-if="tab.category">{{ $t('common.category') }}: {{ tab.category }}</span>
              <span class="tab-info level-badge"
                    v-if="tab.impact"
                    :title="$t('common.impact') + ': ' + (tab.impactLabel || tab.impact)">
                {{ $t('common.impact') }} : {{ getLevelBadge(tab.impact).emoji }} {{ tab.impactLabel || tab.impact }}
              </span>
              <span class="tab-info level-badge"
                    v-if="tab.urgency"
                    :title="$t('common.urgency') + ': ' + (tab.urgencyLabel || tab.urgency)">
                {{ $t('common.urgency') }} : {{ getLevelBadge(tab.urgency).emoji }} {{ tab.urgencyLabel || tab.urgency }}
              </span>
              <span class="tab-info" v-if="tab.writerName">{{ $t('common.createdBy') }}: {{ tab.writerName }}</span>
              <span class="tab-info" v-if="tab.updatedAt">
                {{ $t('common.modified') }} : {{ formatDate(tab.updatedAt) }}
              </span>
              <span class="tab-info" v-else-if="tab.createdAt">
                {{ $t('common.created') }} : {{ formatDate(tab.createdAt) }}
              </span>
            </template>

            <!-- Informations spécifiques TASK -->
            <template v-else-if="tab.ticketType === 'TASK'">
              <span class="tab-info" v-if="tab.requestedByName">{{ $t('common.requestedBy') }}: {{ tab.requestedByName }}</span>
              <span class="tab-info" v-if="tab.requestedForName">{{ $t('common.requestedFor') }}: {{ tab.requestedForName }}</span>
              <span class="tab-info" v-if="tab.writerName">{{ $t('common.createdBy') }}: {{ tab.writerName }}</span>
              <span class="tab-info" v-if="tab.updatedAt">
                {{ $t('common.modified') }} : {{ formatDate(tab.updatedAt) }}
              </span>
              <span class="tab-info" v-else-if="tab.createdAt">
                {{ $t('common.created') }} : {{ formatDate(tab.createdAt) }}
              </span>
            </template>

            <!-- Informations génériques pour autres types -->
            <template v-else>
              <span class="tab-info" v-if="tab.writerName">{{ $t('common.createdBy') }}: {{ tab.writerName }}</span>
              <span class="tab-info" v-if="tab.updatedAt">
                {{ $t('common.modified') }} : {{ formatDate(tab.updatedAt) }}
              </span>
              <span class="tab-info" v-else-if="tab.createdAt">
                {{ $t('common.created') }} : {{ formatDate(tab.createdAt) }}
              </span>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Contenu des onglets (tous les onglets sont rendus mais seul l'actif est visible) -->
    <div class="tab-content">
      <!-- Onglets parents - utilisation de keep-alive pour conserver l'instance des composants -->
      <keep-alive>
        <div 
          v-for="tab in store.parentTabs" 
          :key="tab.id_tab" 
          v-show="store.isParentTabActive(tab.id_tab)"
          class="tab-content-wrapper"
        >
          <!-- Composant spécial pour les onglets admin -->
          <component 
            v-if="tab.component"
            :is="tab.component"
          />
          <!-- Composant par défaut pour les grilles -->
          <ObjectsTab 
            v-else
            :data="tab"
            :tabId="tab.id_tab"
          />
        </div>
      </keep-alive>
      
      <!-- Onglets enfants - Utilisation de keep-alive pour conserver l'instance des composants -->
      <keep-alive>
        <div 
          v-for="tab in store.tabs.filter(t => t.parentId)" 
          :key="tab.id_tab" 
          v-show="store.activeChildTabId === tab.id_tab"
          class="tab-content-wrapper"
        >
          <ObjectCreationsAndUpdates 
            :mode="tab.mode"
            :objectId="tab.objectId"
            :tabId="tab.id_tab"
            :className="tab.className"
          />
        </div>
      </keep-alive>
    </div>
  </div>
</template>

<script>
import { useTabsStore } from '@/stores/tabsStore'
import { useFilterStore } from '@/stores/filterStore'
import { getClassByName } from '@/services/classMapping'
import ObjectsTab from '@/components/objectsTab.vue'
import ObjectCreationsAndUpdates from '@/components/coreForms/objectCreationsAndUpdates.vue'
import AdminPortals from '@/components/admin/AdminPortals.vue'

export default {
  name: 'HierarchicalTabs',
  components: {
    ObjectsTab,
    ObjectCreationsAndUpdates,
    AdminPortals
  },
  setup() {
    console.log('[HierarchicalTabs] Exécution de setup()')
    const store = useTabsStore()
    const filterStore = useFilterStore()
    return {
      store,
      filterStore,
      getClassByName // Exposer la fonction au template
    }
  },
  computed: {
    /**
     * Retourne les filtres actifs pour l'onglet parent actif
     */
    activeFilters() {
      if (!this.store.activeTab || !this.store.activeTab.className) {
        return []
      }
      const tableName = this.store.activeTab.className
      return this.filterStore.getActiveFiltersForTable(tableName) || []
    }
  },
  created() {
    console.log('[HierarchicalTabs] Exécution de created()')
    console.info('[HierarchicalTabs] Initialisation du composant')
  },
  mounted() {
    console.log('[HierarchicalTabs] Exécution de mounted()')
    console.info('[HierarchicalTabs] Composant monté')
  },
  methods: {
    /**
     * Gère le changement d'onglet parent
     * @param {Object} tab - L'onglet à activer
     */
    handleTabSwitch(tab) {
      console.log('[HierarchicalTabs] Exécution de handleTabSwitch()', tab)
      // Vérifie si l'onglet est déjà réellement actif (affiché)
      if (this.store.isParentTabActive(tab.id_tab)) {
        console.info(`[HierarchicalTabs] Onglet ${tab.id_tab} déjà actif, pas de mise à jour.`)
        return
      }
      
      // Active l'onglet et désactive les enfants si nécessaire
      const wasActive = this.store.switchTab(tab.id_tab)
      if (!wasActive) {
        console.info(`[HierarchicalTabs] Changement d'onglet parent : ${tab.id_tab}`)
      }
    },
    
    /**
     * Gère le changement d'onglet enfant
     * @param {Object} tab - L'onglet enfant à activer
     */
    handleChildTabSwitch(tab) {
      console.log('[HierarchicalTabs] Exécution de handleChildTabSwitch()', tab)
      // Vérifie si l'onglet enfant est déjà actif
      if (this.store.activeChildTabId === tab.id_tab) {
        console.info(`[HierarchicalTabs] Onglet enfant ${tab.id_tab} déjà actif, pas de mise à jour.`)
        return
      }

      // Active l'onglet enfant
      const wasActive = this.store.switchChildTab(tab.id_tab)
      if (!wasActive) {
        console.info(`[HierarchicalTabs] Changement d'onglet enfant : ${tab.id_tab}`)
      }
    },

    /**
     * Formate un UUID en version courte (8 premiers caractères)
     * @param {string} uuid - L'UUID complet
     * @returns {string} - Version courte de l'UUID
     */
    formatShortId(uuid) {
      if (!uuid) return 'N/A'
      return uuid.substring(0, 8)
    },

    /**
     * Formate une date en format court (JJ/MM/AAAA)
     * @param {string} dateString - Date au format ISO
     * @returns {string} - Date formatée
     */
    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    },

    /**
     * Formate un code de statut en texte lisible
     * @param {string} statusCode - Le code du statut
     * @returns {string} - Texte formaté
     */
    formatStatus(statusCode) {
      if (!statusCode) return 'N/A'
      // Remplace les underscores par des espaces et capitalise les mots
      return statusCode
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
    },

    /**
     * Retourne la classe CSS appropriée pour un statut basée sur sa signification
     * @param {string} statusCode - Le code du statut du ticket
     * @returns {string} - Nom de la classe CSS
     */
    getStatusClass(statusCode) {
      if (!statusCode) return 'unknown'

      // Statuts de début/nouveaux (bleu)
      const startStatuses = ['NEW', 'DRAFT', 'TO_DO', 'SUBMITTED', 'REQUESTED', 'INITIATED',
                            'PLANNED', 'IN_PREPARATION']
      if (startStatuses.includes(statusCode)) return 'start'

      // Statuts en cours (orange)
      const progressStatuses = ['IN_PROGRESS', 'INVESTIGATING', 'ASSIGNED', 'ACTIVE',
                               'EXECUTING', 'MONITORING', 'EVALUATED', 'PLANNING']
      if (progressStatuses.includes(statusCode)) return 'in-progress'

      // Statuts en attente/révision (jaune/orange clair)
      const reviewStatuses = ['IN_REVIEW', 'IN_TEST', 'PENDING', 'DIAGNOSED', 'WORKAROUND',
                             'TRIAGE', 'ACKNOWLEDGED', 'READY']
      if (reviewStatuses.includes(statusCode)) return 'review'

      // Statuts terminés/résolus (vert)
      const completedStatuses = ['DONE', 'COMPLETED', 'RESOLVED', 'CLOSED', 'FULFILLED',
                                'IMPLEMENTED', 'REVIEWED', 'APPROVED', 'SOLUTION_APPROVED',
                                'APPROVED_REQUEST', 'SCHEDULED']
      if (completedStatuses.includes(statusCode)) return 'completed'

      // Statuts problématiques (rouge)
      const problemStatuses = ['ESCALATED', 'REJECTED', 'CANCELLED', 'REOPENED', 'KNOWN_ERROR',
                              'REJECTED_REQUEST']
      if (problemStatuses.includes(statusCode)) return 'problem'

      // Statuts neutres (gris)
      const neutralStatuses = ['ARCHIVED', 'ROOT_CAUSE_IDENTIFIED', 'SOLUTION_PROPOSED']
      if (neutralStatuses.includes(statusCode)) return 'neutral'

      return 'default'
    },

    /**
     * Retourne la classe CSS et l'emoji appropriés pour un niveau (impact/urgence/priorité)
     * @param {string} level - Le niveau (peut être en français ou anglais)
     * @returns {Object} - Objet contenant la classe CSS et l'emoji
     */
    getLevelBadge(level) {
      if (!level) return { class: '', emoji: '', label: 'N/A' }

      const levelStr = level.toString().toUpperCase()

      // Niveau critique - rouge
      if (levelStr.includes('CRITICAL') || levelStr.includes('CRITIQUE') || levelStr === '1') {
        return { class: 'level-critical', emoji: '🔴', label: level }
      }

      // Niveau élevé - orange
      if (levelStr.includes('HIGH') || levelStr.includes('ÉLEVÉ') || levelStr.includes('ELEVE') ||
          levelStr.includes('HAUT') || levelStr === '2') {
        return { class: 'level-high', emoji: '🟠', label: level }
      }

      // Niveau moyen - jaune
      if (levelStr.includes('MEDIUM') || levelStr.includes('MOYEN') || levelStr.includes('MODERATE') ||
          levelStr === '3') {
        return { class: 'level-medium', emoji: '🟡', label: level }
      }

      // Niveau faible - vert
      if (levelStr.includes('LOW') || levelStr.includes('FAIBLE') || levelStr.includes('BAS') ||
          levelStr === '4') {
        return { class: 'level-low', emoji: '🟢', label: level }
      }

      // Par défaut
      return { class: 'level-low', emoji: '🟢', label: level }
    },

    /**
     * Récupère le label traduit d'un filtre
     * @param {Object} filter - L'objet filtre contenant column
     * @returns {string} - Label traduit ou nom de la colonne
     */
    getFilterLabel(filter) {
      if (!filter || !filter.column) return 'N/A'

      // Récupérer la configuration du filtre pour obtenir le label
      if (this.store.activeTab && this.store.activeTab.className) {
        const filterConfig = this.filterStore.getConfigForTable(this.store.activeTab.className)
        if (filterConfig) {
          const config = filterConfig.find(f => f.column === filter.column)
          if (config && config.label) {
            // Appliquer la traduction sur le label (qui est une clé de traduction)
            return this.$t(config.label)
          }
        }
      }

      // Sinon, formater le nom de colonne (remplacer _ par espaces et capitaliser)
      return filter.column
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },

    /**
     * Formate la valeur d'un filtre pour l'affichage
     * @param {Object} filter - L'objet filtre contenant column, type et value
     * @returns {string} - Valeur formatée pour l'affichage
     */
    formatFilterValue(filter) {
      if (!filter || !filter.value) {
        // Gérer les filtres qui n'ont pas besoin de valeur
        const noValueOperators = ['is_null', 'is_not_null', 'is_true', 'is_false']
        if (filter.type && noValueOperators.includes(filter.type)) {
          return this.$t(`filters.${filter.type}`) || filter.type
        }
        return 'N/A'
      }

      const value = filter.value

      // Si c'est un tableau
      if (Array.isArray(value)) {
        if (value.length === 0) return 'N/A'
        if (value.length === 1) return value[0]
        return value.join(', ')
      }

      // Si c'est un objet (ex: date_range)
      if (typeof value === 'object' && value !== null) {
        const parts = []
        if (value.gte) parts.push(`≥ ${value.gte}`)
        if (value.lte) parts.push(`≤ ${value.lte}`)
        return parts.length > 0 ? parts.join(' & ') : 'N/A'
      }

      // Sinon, retourner la valeur telle quelle
      return value.toString()
    }
  }
}
</script>

<style scoped src="@/assets/styles/hierarchicalTabs.css"></style>
