import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService } from '@/services'
import api from '@/services/api'
import metadataService from '@/services/metadataService'
import ciTypeFieldsService from '@/services/ciTypeFieldsService'
import ticketTypeFieldsService from '@/services/ticketTypeFieldsService'
import { useReferenceDataStore } from '@/stores/referenceDataStore'

/**
 * Composable for object view/edit logic
 * Handles loading, saving, metadata, extended fields, and workflow transitions
 * 
 * @param {Object} options
 * @param {Ref<string>} options.objectType - The object type (e.g., 'persons', 'configuration_items')
 * @param {Ref<string>} options.objectId - The object UUID (null for create mode)
 * @param {Ref<string>} options.mode - 'edit' or 'create'
 */
export function useObjectView(options) {
  const { objectType, objectId, mode } = options

  // Composables
  const toast = useToast()
  const { t, locale } = useI18n()
  const referenceDataStore = useReferenceDataStore()

  // Service
  const service = computed(() => getService(objectType.value))

  // State
  const loading = ref(true)
  const saving = ref(false)
  const item = ref(null)

  // Metadata
  const metadataLoading = ref(true)
  const formFields = ref([])
  const fieldOptions = ref({})
  const objectTypeMetadata = ref(null)

  // Extended fields (for configuration_items, tickets)
  const extendedFields = ref([])
  const extendedFieldsLoading = ref(false)

  // Reference data from store
  const ciTypes = computed(() => referenceDataStore.ciTypes)
  const ciCategories = computed(() => referenceDataStore.ciCategories)

  // Workflow transitions
  const availableTransitions = ref([])

  // Check if object type has a workflow_status field
  const hasWorkflowStatus = computed(() => {
    return formFields.value.some(f => f.field_type === 'workflow_status')
  })

  // Check if current object type is configuration_items
  const isConfigurationItems = computed(() => objectType.value === 'configuration_items')

  // Check if should show extended info tab
  const hasExtendedInfo = computed(() => {
    return ['ci_types', 'ticket_types', 'tickets', 'configuration_items'].includes(objectType.value)
  })

  // Get display name for header
  const getDisplayName = () => {
    if (!item.value) return ''
    
    const nameFields = ['name', 'label', 'code', 'first_name', 'title']
    for (const field of nameFields) {
      if (item.value[field]) return item.value[field]
    }
    
    return item.value.uuid?.substring(0, 8) || t('common.new')
  }

  // Load metadata
  const loadMetadata = async () => {
    try {
      metadataLoading.value = true
      objectTypeMetadata.value = await metadataService.getObjectType(objectType.value)
      
      if (objectTypeMetadata.value) {
        formFields.value = objectTypeMetadata.value.fields.filter(f => f.show_in_form)
        
        // Load options for select fields
        const selectFields = formFields.value.filter(f => f.field_type === 'select' && f.options_source)
        await Promise.all(selectFields.map(async (field) => {
          let options = []
          if (metadataService.isApiEndpoint(field.options_source)) {
            options = await metadataService.fetchOptions(field.options_source)
          } else {
            options = metadataService.parseOptions(field.options_source)
          }
          fieldOptions.value[field.field_name] = options.map(opt => {
            if (opt.label_key) {
              return { ...opt, label: t(opt.label_key) }
            }
            return opt
          })
        }))
      }
    } catch (error) {
      console.error('Failed to load metadata:', error)
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load metadata', life: 3000 })
    } finally {
      metadataLoading.value = false
    }
  }

  // Load reference data from store
  const loadReferenceData = async () => {
    if (['configuration_items', 'ci_types'].includes(objectType.value)) {
      await referenceDataStore.loadCiTypes()
    }
    if (objectType.value === 'ci_types') {
      await referenceDataStore.loadCiCategories()
    }
  }

  // Initialize new item with default values
  const initializeNewItem = () => {
    const defaults = {}
    for (const field of formFields.value) {
      if (field.field_type === 'boolean') {
        defaults[field.field_name] = false
      } else {
        defaults[field.field_name] = null
      }
    }
    
    // Initialize extended_core_fields for configuration_items and tickets
    if (objectType.value === 'configuration_items' || objectType.value === 'tickets') {
      defaults.extended_core_fields = {}
    }
    
    return defaults
  }

  // Load item
  const loadItem = async () => {
    // Load reference data from store first
    await loadReferenceData()
    
    if (mode.value === 'create') {
      item.value = initializeNewItem()
      loading.value = false
      return
    }
    
    if (!objectId.value || !service.value) {
      loading.value = false
      return
    }
    
    try {
      loading.value = true
      
      // Load item by UUID
      if (service.value.getByUuid) {
        item.value = await service.value.getByUuid(objectId.value)
      } else if (service.value.get) {
        item.value = await service.value.get(objectId.value)
      } else {
        // Fallback: search by uuid
        const result = await service.value.search({ 
          filters: { uuid: { value: objectId.value, matchMode: 'equals' } },
          page: 1,
          limit: 1
        })
        item.value = result.data?.[0] || null
      }
      
      // Load extended fields if configuration_items
      if (objectType.value === 'configuration_items' && item.value?.ci_type) {
        await loadExtendedFields(item.value.ci_type)
      }
      
      // Load extended fields if tickets
      if (objectType.value === 'tickets' && item.value?.ticket_type_code) {
        await loadExtendedFieldsForTickets(item.value.ticket_type_code)
      }
    } catch (error) {
      console.error('Failed to load item:', error)
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load item', life: 3000 })
    } finally {
      loading.value = false
    }
  }

  // Load extended fields for configuration_items
  const loadExtendedFields = async (ciTypeCode) => {
    if (!ciTypeCode || objectType.value !== 'configuration_items') {
      extendedFields.value = []
      return
    }
    
    try {
      extendedFieldsLoading.value = true
      
      // First get CI type UUID from code
      if (ciTypes.value.length === 0) {
        await referenceDataStore.loadCiTypes()
      }
      
      const ciType = ciTypes.value.find(ct => ct.code === ciTypeCode)
      if (!ciType) {
        extendedFields.value = []
        return
      }
      
      // Load fields for this CI type
      const fields = await ciTypeFieldsService.getByTypeUuid(ciType.uuid)
      extendedFields.value = fields.filter(f => f.show_in_form).map(f => ({
        ...f,
        label: f._translations?.label?.[locale.value] || f.label
      }))
    } catch (error) {
      console.error('Failed to load extended fields:', error)
      extendedFields.value = []
    } finally {
      extendedFieldsLoading.value = false
    }
  }

  // Load extended fields for tickets
  const loadExtendedFieldsForTickets = async (ticketTypeCode) => {
    if (!ticketTypeCode || objectType.value !== 'tickets') {
      extendedFields.value = []
      return
    }
    
    try {
      extendedFieldsLoading.value = true
      
      // Get ticket type UUID from code
      const ticketTypesResponse = await api.get('/ticket-types')
      const ticketType = ticketTypesResponse.data?.find(t => t.code === ticketTypeCode)
      
      if (!ticketType) {
        console.warn(`[useObjectView] Ticket type not found for code: ${ticketTypeCode}`)
        extendedFields.value = []
        return
      }
      
      // Load fields for this ticket type
      const fields = await ticketTypeFieldsService.getByTypeUuid(ticketType.uuid)
      extendedFields.value = fields.filter(f => f.show_in_form).map(f => ({
        ...f,
        label: f._translations?.label?.[locale.value] || f.label
      }))
    } catch (error) {
      console.error('Failed to load extended fields for tickets:', error)
      extendedFields.value = []
    } finally {
      extendedFieldsLoading.value = false
    }
  }

  // Save item
  const saveItem = async (generalInfoRef = null) => {
    if (!item.value || !service.value) return false
    
    // Validate required fields
    const requiredFields = formFields.value.filter(f => f.is_required)
    for (const field of requiredFields) {
      const value = item.value[field.field_name]
      if (value === null || value === undefined || value === '') {
        toast.add({ severity: 'warn', summary: 'Warning', detail: `${t(field.label_key)} is required`, life: 3000 })
        return false
      }
    }
    
    try {
      saving.value = true
      
      if (mode.value === 'create') {
        const created = await service.value.create(item.value)
        item.value = created
        toast.add({ severity: 'success', summary: 'Success', detail: t('common.created'), life: 3000 })
      } else {
        await service.value.update(item.value.uuid, item.value)
        toast.add({ severity: 'success', summary: 'Success', detail: t('common.saved'), life: 3000 })
      }
      
      // Upload pending attachments after saving the item
      if (generalInfoRef?.value) {
        await generalInfoRef.value.uploadPendingAttachments()
      }
      
      return true
    } catch (error) {
      console.error('Failed to save item:', error)
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save item', life: 3000 })
      return false
    } finally {
      saving.value = false
    }
  }

  // Load available transitions for current status
  const loadAvailableTransitions = async () => {
    // Support any object type with workflow_status field
    if (!hasWorkflowStatus.value || !item.value?.uuid) {
      availableTransitions.value = []
      return
    }
    
    try {
      // Pass current status UUID as query param to get outgoing transitions
      const currentStatusUuid = item.value.rel_status_uuid
      let url = `/workflows/entity/${objectType.value}/${item.value.uuid}/available-statuses`
      if (currentStatusUuid) {
        url += `?currentStatusUuid=${currentStatusUuid}`
      }
      const response = await api.get(url)
      
      // Transform backend response to match StatusPicker expected format
      availableTransitions.value = (response.data || []).map(status => ({
        to_status_uuid: status.uuid,
        to_status_name: status.name,
        name: status.transitionName || '',
        to_status_color: status.category?.color || '#6b7280'
      }))
    } catch (error) {
      console.error('Failed to load available transitions:', error)
      availableTransitions.value = []
    }
  }

  // Apply a transition (change status)
  const applyTransition = async (transition) => {
    if (!item.value || !service.value) return
    
    try {
      saving.value = true
      
      // Update the item with new status
      await service.value.update(item.value.uuid, {
        rel_status_uuid: transition.to_status_uuid
      })
      
      // Reload the item to get updated status
      await loadItem()
      
      // Reload available transitions
      await loadAvailableTransitions()
      
      toast.add({ severity: 'success', summary: 'Success', detail: t('common.saved'), life: 3000 })
    } catch (error) {
      console.error('Failed to apply transition:', error)
      toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to apply transition', life: 3000 })
    } finally {
      saving.value = false
    }
  }

  // Initialize: load metadata and item
  const init = async () => {
    await loadMetadata()
    await loadItem()
    
    // Load transitions after both metadata and item are loaded
    if (hasWorkflowStatus.value && mode.value === 'edit' && item.value?.uuid) {
      await loadAvailableTransitions()
    }
  }

  // Watch for ci_type changes to reload extended fields
  watch(() => item.value?.ci_type, async (newCiType, oldCiType) => {
    if (newCiType && newCiType !== oldCiType && objectType.value === 'configuration_items') {
      await loadExtendedFields(newCiType)
    }
  })

  // Watch for ticket_type_code changes to reload extended fields
  watch(() => item.value?.ticket_type_code, async (newTicketType, oldTicketType) => {
    if (newTicketType && newTicketType !== oldTicketType && objectType.value === 'tickets') {
      await loadExtendedFieldsForTickets(newTicketType)
    }
  })

  // Watch for status changes to reload transitions
  watch(() => item.value?.rel_status_uuid, async () => {
    if (hasWorkflowStatus.value && mode.value === 'edit') {
      await loadAvailableTransitions()
    }
  })

  return {
    // State
    loading,
    saving,
    item,
    
    // Metadata
    metadataLoading,
    formFields,
    fieldOptions,
    objectTypeMetadata,
    
    // Extended fields
    extendedFields,
    extendedFieldsLoading,
    
    // Reference data
    ciTypes,
    ciCategories,
    
    // Workflow
    availableTransitions,
    hasWorkflowStatus,
    
    // Computed
    isConfigurationItems,
    hasExtendedInfo,
    
    // Methods
    getDisplayName,
    loadItem,
    saveItem,
    applyTransition,
    init
  }
}
