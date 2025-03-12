<template>
  <div class="audit-table">
    <div class="table-container">
      <table v-if="auditData.length > 0">
        <thead>
          <tr>
            <th>{{ $t('audit.eventType') }}</th>
            <th>{{ $t('audit.objectType') }}</th>
            <th>{{ $t('audit.oldValue') }}</th>
            <th>{{ $t('audit.newValue') }}</th>
            <th>{{ $t('audit.user') }}</th>
            <th>{{ $t('audit.time') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in auditData" :key="item.id">
            <td>
              <span class="event-type" :class="getEventTypeClass(item.event_type)">
                {{ formatEventType(item.event_type) }}
              </span>
            </td>
            <td>{{ formatObjectType(item.object_type, item.attribute_name) }}</td>
            <td class="old-value">{{ item.old_value }}</td>
            <td class="new-value">{{ item.new_value }}</td>
            <td>{{ getUserName(item.user_id) }}</td>
            <td class="time-ago">{{ getTimeAgo(item.event_date) }}</td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-table">
        {{ $t('audit.noData') }}
      </div>
    </div>
    <div class="table-footer" v-if="auditData.length > 0">
      {{ $t('audit.totalChanges') }}: {{ auditData.length }}
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
    formatObjectType(objectType, attributeName) {
      if (!objectType) return ''
      
      // Convert snake_case to Title Case for object_type
      const formattedObjectType = objectType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      // If attribute_name exists, concatenate with object_type
      if (attributeName) {
        return `${objectType}/${attributeName}`
      }
      
      return formattedObjectType
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
        return years === 1 
          ? this.$t('audit.timeAgo.year')
          : this.$t('audit.timeAgo.years', { count: years })
      } else if (months > 0) {
        return months === 1 
          ? this.$t('audit.timeAgo.month')
          : this.$t('audit.timeAgo.months', { count: months })
      } else if (days > 0) {
        return days === 1 
          ? this.$t('audit.timeAgo.day')
          : this.$t('audit.timeAgo.days', { count: days })
      } else if (hours > 0) {
        return hours === 1 
          ? this.$t('audit.timeAgo.hour')
          : this.$t('audit.timeAgo.hours', { count: hours })
      } else if (minutes > 0) {
        return minutes === 1 
          ? this.$t('audit.timeAgo.minute')
          : this.$t('audit.timeAgo.minutes', { count: minutes })
      } else if (seconds > 10) {
        return this.$t('audit.timeAgo.seconds')
      } else {
        return this.$t('audit.timeAgo.justNow')
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

.old-value, .new-value {
  white-space: normal;
  word-break: break-all;
}
</style>
