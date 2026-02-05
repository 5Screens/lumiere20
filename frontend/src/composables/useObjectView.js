import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService } from '@/services'
import api from '@/services/api'
import metadataService from '@/services/metadataService'
import ciTypeFieldsService from '@/services/ciTypeFieldsService'
import ticketTypeFieldsService from '@/services/ticketTypeFieldsService'
import { useReferenceDataStore } from '@/stores/referenceDataStore'
import { useAuthStore } from '@/stores/authStore'
import { useUploadStore } from '@/stores/uploadStore'
import { useTabsStore } from '@/stores/tabsStore'

/**
 * Composable for object view/edit logic
 * Handles loading, saving, metadata, extended fields, and workflow transitions
 * 
 * @param {Object} options
 * @param {Ref<string>} options.objectType - The object type (e.g., 'persons', 'configuration_items')
 * @param {Ref<string>} options.objectId - The object UUID (null for create mode)
 * @param {Ref<string>} options.mode - 'edit' or 'create'
 * @param {Ref<string>} options.ciTypeUuid - CI type UUID for create mode (configuration_items)
 * @param {Ref<string>} options.ticketTypeCode - Ticket type code for create mode (tickets)
 */
export function useObjectView(options) {
  const { objectType, objectId, mode, ciTypeUuid, ticketTypeCode } = options

  // Composables
  const toast = useToast()
  const { t, locale } = useI18n()
  const referenceDataStore = useReferenceDataStore()
  const authStore = useAuthStore()
  const uploadStore = useUploadStore()
  const tabsStore = useTabsStore()

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
  // Raw fields with _translations (not locale-applied)
  const extendedFieldsRaw = ref([])
  const extendedFieldsLoading = ref(false)

  // Computed: apply current locale translations to extended fields
  const extendedFields = computed(() => {
    return extendedFieldsRaw.value.map(f => ({
      ...f,
      label: f._translations?.label?.[locale.value] || f.label
    }))
  })

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

  // Check if should show related tickets tab (for persons in edit or view mode)
  const hasRelatedTickets = computed(() => {
    return objectType.value === 'persons' && (mode.value === 'edit' || mode.value === 'view')
  })

  // Get reverse link fields (for displaying related objects in separate tabs)
  const reverseLinkFields = computed(() => {
    if (!objectTypeMetadata.value?.fields) return []
    return objectTypeMetadata.value.fields.filter(f => f.field_type === 'reverse_link' && f.show_in_detail)
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
      console.error(`[useObjectView] Failed to load metadata for objectType: ${objectType.value}`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      toast.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: `Failed to load metadata for ${objectType.value}: ${error.response?.data?.message || error.message}`, 
        life: 5000 
      })
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
  const initializeNewItem = async () => {
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
    
    // Set ticket_type_code if provided (for tickets)
    if (objectType.value === 'tickets' && ticketTypeCode?.value) {
      defaults.ticket_type_code = ticketTypeCode.value
    }
    
    // Set ci_type if ciTypeUuid is provided (for configuration_items)
    if (objectType.value === 'configuration_items' && ciTypeUuid?.value) {
      // Get CI type code from UUID
      if (ciTypes.value.length === 0) {
        await referenceDataStore.loadCiTypes()
      }
      const ciType = ciTypes.value.find(ct => ct.uuid === ciTypeUuid.value)
      if (ciType) {
        defaults.ci_type = ciType.code
      }
    }
    
    // Set writer_uuid to current user for tickets
    if (objectType.value === 'tickets' && authStore.user?.uuid) {
      defaults.writer_uuid = authStore.user.uuid
    }
    
    return defaults
  }

  // Load item
  const loadItem = async () => {
    // Load reference data from store first
    await loadReferenceData()
    
    if (mode.value === 'create') {
      item.value = await initializeNewItem()
      
      // Load extended fields for create mode
      if (objectType.value === 'tickets' && ticketTypeCode?.value) {
        await loadExtendedFieldsForTickets(ticketTypeCode.value)
      }
      if (objectType.value === 'configuration_items' && ciTypeUuid?.value) {
        const ciType = ciTypes.value.find(ct => ct.uuid === ciTypeUuid.value)
        if (ciType) {
          await loadExtendedFields(ciType.code)
        }
      }
      
      // Load initial workflow statuses for create mode
      if (hasWorkflowStatus.value) {
        await loadInitialStatuses()
      }
      
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
      extendedFieldsRaw.value = []
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
        extendedFieldsRaw.value = []
        return
      }
      
      // Load fields for this CI type - store raw, computed will apply locale
      const fields = await ciTypeFieldsService.getByTypeUuid(ciType.uuid)
      extendedFieldsRaw.value = fields.filter(f => f.show_in_form)
    } catch (error) {
      console.error('Failed to load extended fields:', error)
      extendedFieldsRaw.value = []
    } finally {
      extendedFieldsLoading.value = false
    }
  }

  // Load extended fields for tickets
  const loadExtendedFieldsForTickets = async (ticketTypeCode) => {
    if (!ticketTypeCode || objectType.value !== 'tickets') {
      extendedFieldsRaw.value = []
      return
    }
    
    try {
      extendedFieldsLoading.value = true
      
      // Get ticket type UUID from code
      const ticketTypesResponse = await api.get('/ticket-types')
      const ticketType = ticketTypesResponse.data?.find(t => t.code === ticketTypeCode)
      
      if (!ticketType) {
        console.warn(`[useObjectView] Ticket type not found for code: ${ticketTypeCode}`)
        extendedFieldsRaw.value = []
        return
      }
      
      // Load fields for this ticket type
      const fields = await ticketTypeFieldsService.getByTypeUuid(ticketType.uuid)
      console.log('[useObjectView] loadExtendedFieldsForTickets - raw fields from API:', fields)
      console.log('[useObjectView] loadExtendedFieldsForTickets - current locale:', locale.value)
      console.log('[useObjectView] loadExtendedFieldsForTickets - first field _translations:', fields[0]?._translations)
      // Store raw fields with _translations - computed will apply locale
      extendedFieldsRaw.value = fields.filter(f => f.show_in_form)
      console.log(`[useObjectView] Loaded ${extendedFieldsRaw.value.length} extended fields for tickets`)
    } catch (error) {
      console.error('Failed to load extended fields for tickets:', error)
      extendedFieldsRaw.value = []
    } finally {
      extendedFieldsLoading.value = false
    }
  }

  // Save item
  // tabId is optional, used to close the tab after successful creation
  const saveItem = async (generalInfoRef = null, tabId = null) => {
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
        // Step 1: Create the entity
        const created = await service.value.create(item.value)
        const newEntityUuid = created.uuid
        item.value = created
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.created'), life: 3000 })
        
        // Step 2: Check for pending attachments
        const hasPendingAttachments = generalInfoRef?.value?.hasPendingAttachments?.() || false
        
        if (hasPendingAttachments) {
          // Show upload toast with progress
          toast.add({ 
            severity: 'custom', 
            summary: t('common.uploadingFiles'), 
            group: 'upload-progress', 
            styleClass: 'backdrop-blur-lg rounded-2xl',
            life: 60000 // Long life, will be closed manually
          })
          uploadStore.startUpload()
          uploadStore.registerAbortController(null)
          
          // Upload with progress callback
          const uploadResult = await generalInfoRef.value.uploadPendingAttachmentsWithProgress(
            newEntityUuid,
            (progress) => uploadStore.updateProgress(progress),
            () => uploadStore.isCancelled
          )
          
          if (uploadResult.cancelled) {
            toast.add({ severity: 'warn', summary: t('common.warning'), detail: t('common.uploadCancelled'), life: 3000 })
          } else if (uploadResult.success) {
            uploadStore.finishUpload()
            toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.filesUploaded'), life: 3000 })
          } else {
            uploadStore.reset()
            toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.uploadFailed'), life: 5000 })
          }

          // Close upload progress toast group
          toast.removeGroup('upload-progress')
        }
        
        // Step 3: Close the create tab
        if (tabId) {
          tabsStore.closeTab(tabId)
        }
        
      } else {
        // Edit mode: simple update
        await service.value.update(item.value.uuid, item.value)
        toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 3000 })
        
        // Upload pending attachments after saving the item (edit mode)
        if (generalInfoRef?.value?.hasPendingAttachments?.()) {
          await generalInfoRef.value.uploadPendingAttachments()
        }
      }
      
      return true
    } catch (error) {
      console.error('Failed to save item:', error)
      toast.add({ severity: 'error', summary: t('common.error'), detail: t('common.saveFailed'), life: 3000 })
      return false
    } finally {
      saving.value = false
    }
  }

  // Load initial statuses for create mode (statuses with is_initial = true)
  const loadInitialStatuses = async () => {
    if (!hasWorkflowStatus.value) {
      availableTransitions.value = []
      return
    }
    
    try {
      // For tickets, get initial statuses based on ticket type
      if (objectType.value === 'tickets' && ticketTypeCode?.value) {
        const response = await api.get(`/workflows/entity-type/tickets/initial-statuses?ticketTypeCode=${ticketTypeCode.value}`)
        availableTransitions.value = (response.data || []).map(status => ({
          to_status_uuid: status.uuid,
          to_status_name: status.name,
          name: '',
          to_status_color: status.category?.color || '#6b7280'
        }))
      } else {
        // Generic initial statuses for other entity types
        const response = await api.get(`/workflows/entity-type/${objectType.value}/initial-statuses`)
        availableTransitions.value = (response.data || []).map(status => ({
          to_status_uuid: status.uuid,
          to_status_name: status.name,
          name: '',
          to_status_color: status.category?.color || '#6b7280'
        }))
      }
    } catch (error) {
      console.error('Failed to load initial statuses:', error)
      availableTransitions.value = []
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
    hasRelatedTickets,
    reverseLinkFields,
    
    // Methods
    getDisplayName,
    loadItem,
    saveItem,
    applyTransition,
    init
  }
}
