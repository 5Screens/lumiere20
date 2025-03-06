<template>
  <div class="audit-table">
    <div class="table-container">
      <table v-if="auditData.length > 0">
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Object Type</th>
            <th>Old Value</th>
            <th>New Value</th>
            <th>User</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in auditData" :key="item.id">
            <td>
              <span class="event-type" :class="getEventTypeClass(item.event_type)">
                {{ formatEventType(item.event_type) }}
              </span>
            </td>
            <td>{{ formatObjectType(item.object_type) }}</td>
            <td class="old-value" :title="item.old_value">{{ item.old_value }}</td>
            <td class="new-value" :title="item.new_value">{{ item.new_value }}</td>
            <td>{{ getUserName(item.user_id) }}</td>
            <td class="time-ago">{{ getTimeAgo(item.event_date) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-table">
        No audit data available
      </div>
    </div>
    <div class="table-footer" v-if="auditData.length > 0">
      Total changes: {{ auditData.length }}
    </div>
  </div>
</template>

<script>
// Import du service API centralisé pour gérer les appels HTTP
import apiService from '@/services/apiService'

export default {
  name: 'AuditTable',
  props: {
    objectUuids: {
      type: Array,
      default: () => []
    },
    objectUuid: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      auditData: [],
      loading: false,
      error: null
    }
  },
  computed: {
    // Combine les deux props pour avoir une liste complète d'UUIDs
    allUuids() {
      const uuids = [...this.objectUuids]
      if (this.objectUuid && !uuids.includes(this.objectUuid)) {
        uuids.push(this.objectUuid)
      }
      return uuids.filter(uuid => uuid) // Filtre les valeurs vides
    }
  },
  methods: {
    /**
     * Fetch audit data from API for all UUIDs
     */
    async fetchAuditData() {
      if (this.allUuids.length === 0) {
        this.auditData = []
        return
      }
      
      this.loading = true
      this.error = null
      this.auditData = []
      
      try {
        // Fetch data for each UUID
        const promises = this.allUuids.map(uuid => 
          apiService.get(`audit_changes?uuid=${uuid}`)
        )
        
        // Wait for all requests to complete
        const results = await Promise.all(promises)
        
        // Combine all results into one array
        let combinedData = []
        results.forEach(result => {
          if (Array.isArray(result)) {
            combinedData = [...combinedData, ...result]
          }
        })
        
        // Sort by event date, most recent first
        combinedData.sort((a, b) => {
          return new Date(b.event_date) - new Date(a.event_date)
        })
        
        this.auditData = combinedData
      } catch (err) {
        console.error('Error fetching audit data:', err)
        this.error = 'Failed to load audit data'
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Format event type for display
     */
    formatEventType(eventType) {
      if (!eventType) return ''
      
      // Remove 'Field_' prefix if present and convert to title case
      return eventType.replace('Field_', '')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase())
    },
    
    /**
     * Get CSS class for event type
     */
    getEventTypeClass(eventType) {
      if (!eventType) return ''
      
      if (eventType.includes('UPDATED')) {
        return 'event-type-updated'
      } else if (eventType.includes('CREATED')) {
        return 'event-type-created'
      } else if (eventType.includes('DELETED')) {
        return 'event-type-deleted'
      }
      
      return ''
    },
    
    /**
     * Format object type for display
     */
    formatObjectType(objectType) {
      if (!objectType) return ''
      
      // Convert snake_case to Title Case
      return objectType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    
    /**
     * Get user name from user ID
     */
    getUserName(userId) {
      if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
        return 'System'
      }
      
      // In a real application, you might want to fetch user names from a users service
      return userId
    },
    
    /**
     * Calculate time ago from date
     */
    getTimeAgo(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      
      const seconds = Math.floor((now - date) / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)
      const months = Math.floor(days / 30)
      const years = Math.floor(months / 12)
      
      if (years > 0) {
        return years === 1 ? 'il y a 1 an' : `il y a ${years} ans`
      } else if (months > 0) {
        return months === 1 ? 'il y a 1 mois' : `il y a ${months} mois`
      } else if (days > 0) {
        return days === 1 ? 'il y a 1 jour' : `il y a ${days} jours`
      } else if (hours > 0) {
        return hours === 1 ? 'il y a 1 heure' : `il y a ${hours} heures`
      } else if (minutes > 0) {
        return minutes === 1 ? 'il y a 1 minute' : `il y a ${minutes} minutes`
      } else {
        return 'il y a quelques secondes'
      }
    }
  },
  created() {
    this.fetchAuditData()
  },
  watch: {
    allUuids: {
      handler() {
        this.fetchAuditData()
      },
      deep: true,
      immediate: true
    }
  }
}
</script>

<style scoped>
@import "@/assets/styles/auditTable.css";
</style>
