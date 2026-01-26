<template>
  <div class="h-full flex flex-col gap-4 p-4">
    <!-- Filter buttons -->
    <div class="flex items-center gap-2 flex-wrap">
      <SelectButton 
        v-model="selectedRole" 
        :options="roleOptions" 
        optionLabel="label" 
        optionValue="value"
        :allowEmpty="false"
        size="small"
      />
      <Button 
        icon="pi pi-refresh" 
        severity="secondary" 
        text 
        rounded
        size="small"
        @click="loadTickets(true)"
        :loading="loading"
        v-tooltip.bottom="$t('common.refresh')"
      />
      <span class="text-sm text-surface-500 ml-auto">
        {{ $t('common.totalResults', { count: total }) }}
      </span>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- Tickets list -->
    <div v-else-if="tickets.length > 0" class="flex-1 overflow-auto">
      <ul class="list-none p-0 m-0 flex flex-col gap-2">
        <li 
          v-for="ticket in tickets" 
          :key="ticket.uuid"
          class="flex flex-col gap-1 p-3 rounded-lg bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer transition-colors border border-surface-200 dark:border-surface-700"
          @click="openTicket(ticket)"
        >
          <!-- Header: Type icon + Title + Status -->
          <div class="flex items-center gap-2">
            <i 
              v-if="ticket.ticket_type?.icon" 
              :class="['pi', ticket.ticket_type.icon, 'text-primary']" 
            />
            <span class="font-medium flex-1 truncate">{{ ticket.title }}</span>
            <Tag 
              v-if="ticket.status"
              :value="ticket.status.name"
              :style="getStatusStyle(ticket.status)"
              size="small"
            />
          </div>

          <!-- Secondary info: Type label + CI + Date -->
          <div class="flex items-center gap-3 text-xs text-surface-500">
            <span v-if="ticket.ticket_type?.label">{{ ticket.ticket_type.label }}</span>
            <span v-if="ticket.configuration_item" class="flex items-center gap-1">
              <i class="pi pi-cog" />
              {{ ticket.configuration_item.name }}
            </span>
            <span class="ml-auto">{{ formatDate(ticket.updated_at) }}</span>
          </div>

          <!-- Role badges -->
          <div class="flex items-center gap-1 mt-1">
            <Tag 
              v-for="role in ticket._personRoles" 
              :key="role"
              :value="$t(`persons.ticketRole.${role}`)"
              :severity="getRoleSeverity(role)"
              size="small"
            />
          </div>
        </li>
      </ul>

      <!-- Load more button -->
      <div v-if="hasMore" class="flex justify-center mt-4">
        <Button 
          :label="$t('common.loadMore')" 
          icon="pi pi-chevron-down"
          severity="secondary"
          text
          @click="loadMore"
          :loading="loadingMore"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center text-surface-500">
        <i class="pi pi-ticket text-4xl mb-2" />
        <p>{{ $t('persons.noRelatedTickets') }}</p>
      </div>
    </div>

    <!-- Ticket Drawer -->
    <Drawer 
      v-model:visible="drawerVisible" 
      position="right"
      class="w-full md:w-[600px]"
      :showCloseIcon="false"
      :showHeader="false"
      :dismissable="!objectViewHasUnsavedChanges"
      @hide="onDrawerHide"
    >
      <ObjectView
        ref="objectViewRef"
        object-type="tickets"
        :object-id="selectedTicketId"
        mode="edit"
        @saved="onDrawerSaved"
        @close="onDrawerClose"
      />
    </Drawer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/services/api'

// PrimeVue components
import SelectButton from 'primevue/selectbutton'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'

// Custom components
import ObjectView from './ObjectView.vue'

// Props
const props = defineProps({
  personUuid: {
    type: String,
    required: true
  }
})

// Composables
const { t } = useI18n()

// State
const loading = ref(false)
const loadingMore = ref(false)
const tickets = ref([])
const total = ref(0)
const page = ref(1)
const limit = ref(25)
const selectedRole = ref('all')

// Drawer state
const drawerVisible = ref(false)
const selectedTicketId = ref(null)
const objectViewRef = ref(null)

// Role filter options
const roleOptions = computed(() => [
  { label: t('persons.ticketRole.all'), value: 'all' },
  { label: t('persons.ticketRole.writer'), value: 'writer' },
  { label: t('persons.ticketRole.requested_for'), value: 'requested_for' },
  { label: t('persons.ticketRole.requested_by'), value: 'requested_by' },
])

// Computed
const hasMore = computed(() => tickets.value.length < total.value)

// Check if ObjectView has unsaved changes
const objectViewHasUnsavedChanges = computed(() => {
  if (!objectViewRef.value) return false
  return objectViewRef.value.hasUnsavedChanges?.()
})

// Methods
const loadTickets = async (reset = true) => {
  if (reset) {
    loading.value = true
    page.value = 1
    tickets.value = []
  } else {
    loadingMore.value = true
  }

  try {
    const response = await api.get(`/persons/${props.personUuid}/tickets`, {
      params: {
        role: selectedRole.value,
        page: page.value,
        limit: limit.value
      }
    })

    if (reset) {
      tickets.value = response.data.data
    } else {
      tickets.value = [...tickets.value, ...response.data.data]
    }
    total.value = response.data.total
  } catch (error) {
    console.error('Error loading related tickets:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  loadTickets(false)
}

const openTicket = (ticket) => {
  selectedTicketId.value = ticket.uuid
  drawerVisible.value = true
}

// Drawer handlers
const onDrawerHide = () => {
  objectViewRef.value = null
}

const onDrawerClose = () => {
  drawerVisible.value = false
}

const onDrawerSaved = () => {
  drawerVisible.value = false
  // Reload tickets to reflect any changes
  loadTickets(true)
}

const getStatusStyle = (status) => {
  const color = status?.category?.color || '#6b7280'
  return {
    backgroundColor: `${color}20`,
    color: color,
    border: `1px solid ${color}40`
  }
}

const getRoleSeverity = (role) => {
  const severities = {
    writer: 'info',
    requested_for: 'success',
    requested_by: 'warn'
  }
  return severities[role] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

// Watch for role filter changes
watch(selectedRole, () => {
  loadTickets(true)
})

// Watch for personUuid changes
watch(() => props.personUuid, (newUuid) => {
  if (newUuid) {
    loadTickets(true)
  }
}, { immediate: false })

// Load on mount
onMounted(() => {
  if (props.personUuid) {
    loadTickets(true)
  }
})
</script>
