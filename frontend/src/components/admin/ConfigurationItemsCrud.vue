<template>
    <div class="h-full flex flex-col p-4 overflow-hidden">
        <ContextMenu ref="cm" :model="menuModel" @hide="selectedItem = null" />
        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
            <Toolbar class="mb-6 !border-0 !bg-transparent">
                <template #start>
                    <ButtonGroup>
                        <Button :label="$t('configurationItems.actions.new')" icon="pi pi-plus" severity="secondary" @click="openNewTab" />
                        <Button :label="$t('configurationItems.actions.delete')" icon="pi pi-trash" severity="secondary" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
                    </ButtonGroup>
                </template>

                <template #end>
                    <Button :label="$t('configurationItems.actions.export')" icon="pi pi-file-export" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedItems"
                v-model:contextMenuSelection="selectedItem"
                v-model:filters="filters"
                :value="items"
                dataKey="uuid"
                :paginator="true"
                :rows="pageSize"
                :totalRecords="totalRecords"
                :lazy="true"
                :loading="loading"
                filterDisplay="menu"
                scrollable
                scrollHeight="flex"
                :globalFilterFields="['name', 'ci_type', 'description']"
                resizableColumns
                columnResizeMode="expand"
                reorderableColumns
                stateStorage="local"
                stateKey="configuration-items-table"
                editMode="cell"
                @cellEditComplete="onCellEditComplete"
                contextMenu
                @page="onPage"
                @sort="onSort"
                @rowContextmenu="onRowContextMenu"
                @columnReorder="onColumnReorder"
                @stateRestore="onStateRestore"
                @stateSave="onStateSave"
                v-model:sortField="sortField"
                v-model:sortOrder="sortOrder"
                removableSort
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                :currentPageReportTemplate="paginationTemplate"
            >
                <template #header>
                    <div class="flex justify-between">
                        <div class="flex items-center">
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" :placeholder="$t('configurationItems.search.placeholder')" />
                            </IconField>
                            <Button type="button" icon="pi pi-filter-slash" severity="secondary" class="ml-2" @click="clearFilters()" :disabled="!hasActiveFilters" />
                            <Popover ref="columnTogglePopover">
                                <template #default>
                                    <div class="p-4">
                                        <div class="flex flex-col gap-2">
                                            <div v-for="col of toggleableColumns" :key="col.field" class="flex items-center gap-2">
                                                <Checkbox v-model="selectedColumns" :inputId="col.field" :value="col" />
                                                <label :for="col.field">{{ col.header }}</label>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                            </Popover>
                        </div>
                        <div class="flex items-center gap-2">
                            <Button type="button" icon="pi pi-cog" severity="secondary" @click="toggleColumnSelector" />
                            <Button icon="pi pi-refresh" severity="secondary" @click="loadItems()" :loading="loading" style="margin-left: 0.75rem" />
                        </div>
                    </div>
                </template>

                <Column field="_selection" selectionMode="multiple" style="min-width: 3rem; width: 3rem" :exportable="false" :reorderableColumn="false" frozen></Column>
                <Column field="_actions" style="min-width: 3rem; width: 3rem" :exportable="false" :reorderableColumn="false" frozen>
                    <template #body="{ data }">
                        <Button icon="pi pi-search" @click="openEditTab(data)" severity="secondary" rounded size="small" />
                    </template>
                </Column>
                <Column v-if="isColumnVisible('name')" field="name" :header="$t('configurationItems.table.columns.name')" sortable style="min-width: 16rem">
                    <template #body="{ data }">
                        {{ data.name }}
                    </template>
                    <template #editor="{ data, field }">
                        <InputText v-model="data[field]" autofocus fluid />
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" :placeholder="$t('configurationItems.search.placeholder')" />
                    </template>
                </Column>
                <Column v-if="isColumnVisible('ci_type')" field="ci_type" :header="$t('configurationItems.table.columns.type')" sortable :filterMenuStyle="{ width: '14rem' }" style="min-width: 10rem">
                    <template #body="{ data }">
                        <Tag :value="data.ci_type" :severity="getTypeSeverity(data.ci_type)" />
                    </template>
                    <template #editor="{ data, field }">
                        <Select v-model="data[field]" :options="ciTypeOptions" optionLabel="label" optionValue="value" autofocus fluid />
                    </template>
                    <template #filter="{ filterModel }">
                        <Select v-model="filterModel.value" :options="ciTypeOptions" optionLabel="label" optionValue="value" :placeholder="$t('configurationItems.filter.placeholder')" showClear>
                            <template #option="slotProps">
                                <Tag :value="slotProps.option.value" :severity="getTypeSeverity(slotProps.option.value)" />
                            </template>
                        </Select>
                    </template>
                </Column>
                <Column v-if="isColumnVisible('description')" field="description" :header="$t('configurationItems.table.columns.description')" sortable style="min-width: 20rem">
                    <template #body="{ data }">
                        <span class="block max-w-[300px] truncate">{{ data.description || '-' }}</span>
                    </template>
                    <template #editor="{ data, field }">
                        <InputText v-model="data[field]" autofocus fluid />
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" :placeholder="$t('configurationItems.search.placeholder')" />
                    </template>
                </Column>
                <Column v-if="isColumnVisible('created_at')" field="created_at" :header="$t('configurationItems.table.columns.created')" sortable dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" :placeholder="$t('configurationItems.search.placeholder')" showButtonBar />
                    </template>
                </Column>
                <Column v-if="isColumnVisible('updated_at')" field="updated_at" :header="$t('configurationItems.table.columns.updated')" sortable dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.updated_at) }}
                    </template>
                    <template #filter="{ filterModel }">
                        <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" :placeholder="$t('configurationItems.search.placeholder')" showButtonBar />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" :header="$t('configurationItems.dialog.confirm.title')" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="item" v-html="$t('configurationItems.dialog.deleteOne.message', { name: item.name })"></span>
            </div>
            <template #footer>
                <Button :label="$t('configurationItems.dialog.actions.no')" icon="pi pi-times" text @click="deleteItemDialog = false" severity="secondary" variant="text" />
                <Button :label="$t('configurationItems.dialog.actions.yes')" icon="pi pi-check" @click="deleteItem" severity="danger" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" :header="$t('configurationItems.dialog.confirm.title')" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>{{ $t('configurationItems.dialog.deleteMany.message') }}</span>
            </div>
            <template #footer>
                <Button :label="$t('configurationItems.dialog.actions.no')" icon="pi pi-times" text @click="deleteItemsDialog = false" severity="secondary" variant="text" />
                <Button :label="$t('configurationItems.dialog.actions.yes')" icon="pi pi-check" text @click="deleteSelectedItems" severity="danger" />
            </template>
        </Dialog>

        <Toast position="bottom-right" />
    </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { useTabsStore } from '@/stores/tabsStore';
import configurationItemsService from '@/services/configurationItemsService';
import { PAGINATION_CONFIG, DEBOUNCE_DELAY_MS } from '@/config/config';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toolbar from 'primevue/toolbar';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Toast from 'primevue/toast';
import ContextMenu from 'primevue/contextmenu';
import ButtonGroup from 'primevue/buttongroup';
import DatePicker from 'primevue/datepicker';
import Popover from 'primevue/popover';
import Checkbox from 'primevue/checkbox';

const props = defineProps({
    tabId: {
        type: String,
        required: true
    }
});

const toast = useToast();
const { t, locale } = useI18n();
const tabsStore = useTabsStore();
const cm = ref();
const dt = ref();
const columnTogglePopover = ref();
const items = ref([]);
const deleteItemDialog = ref(false);
const deleteItemsDialog = ref(false);
const item = ref({});
const selectedItem = ref();
const selectedItems = ref();
let searchTimeout = null;

// Column toggle
const toggleableColumns = computed(() => [
    { field: 'name', header: t('configurationItems.table.columns.name') },
    { field: 'ci_type', header: t('configurationItems.table.columns.type') },
    { field: 'description', header: t('configurationItems.table.columns.description') },
    { field: 'created_at', header: t('configurationItems.table.columns.created') },
    { field: 'updated_at', header: t('configurationItems.table.columns.updated') }
]);
const selectedColumns = ref([...toggleableColumns.value]);

const isColumnVisible = (field) => {
    return selectedColumns.value.some(col => col.field === field);
};

const toggleColumnSelector = (event) => {
    columnTogglePopover.value.toggle(event);
};

// Computed property for pagination template based on current locale
const paginationTemplate = computed(() => {
    const templates = {
        fr: 'Affichage de {first} à {last} sur {totalRecords} éléments de configuration',
        en: 'Showing {first} to {last} of {totalRecords} configuration items',
        es: 'Mostrando {first} a {last} de {totalRecords} elementos de configuración',
        pt: 'Mostrando {first} a {last} de {totalRecords} itens de configuração'
    };
    return templates[locale.value] || templates.en;
});

const initFilters = () => {
    return {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        ci_type: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] },
        created_at: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
        updated_at: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] }
    };
};

const filters = ref(initFilters());

// Check if any filter has an active value
const hasActiveFilters = computed(() => {
    // Check global filter
    if (filters.value.global?.value) return true;
    
    // Check column filters
    const columnFilters = ['name', 'ci_type', 'description', 'created_at', 'updated_at'];
    for (const field of columnFilters) {
        const filter = filters.value[field];
        if (filter?.constraints) {
            for (const constraint of filter.constraints) {
                if (constraint.value !== null && constraint.value !== undefined && constraint.value !== '') {
                    return true;
                }
            }
        }
    }
    return false;
});

const loading = ref(false);
const totalRecords = ref(0);
const currentPage = ref(1);
const pageSize = PAGINATION_CONFIG.pageSizes['Configuration_items'] || 25;
const sortField = ref('updated_at');
const sortOrder = ref(-1); // 1 for asc, -1 for desc (descending = most recent first)

const ciTypeOptions = ref([
    { label: t('configurationItems.types.ups'), value: 'UPS' },
    { label: t('configurationItems.types.application'), value: 'APPLICATION' },
    { label: t('configurationItems.types.server'), value: 'SERVER' },
    { label: t('configurationItems.types.networkDevice'), value: 'NETWORK_DEVICE' },
    { label: t('configurationItems.types.generic'), value: 'GENERIC' }
]);

const menuModel = ref([
    { label: t('configurationItems.contextMenu.edit'), icon: 'pi pi-pencil', command: () => openEditTab(selectedItem.value) },
    { label: t('configurationItems.contextMenu.delete'), icon: 'pi pi-trash', command: () => confirmDeleteItem(selectedItem.value) }
]);

// Flag to prevent double loading on mount
let isInitialLoad = true;

onMounted(async () => {
    console.log('[ConfigurationItemsCrud] Mounted with tabId:', props.tabId);
    await loadItems();
    // After initial load, allow watcher to trigger
    isInitialLoad = false;
});

// Watch for child tabs closing to reload data
watch(() => tabsStore.activeChildTabs.length, (newLength, oldLength) => {
    // If a child tab was closed (length decreased), reload items
    if (newLength < oldLength) {
        loadItems();
    }
});

// Watch for any filter changes to trigger search with debounce
watch(filters, () => {
    // Skip if this is the initial load (already handled by onMounted)
    if (isInitialLoad) return;
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        loadItems(1);
    }, DEBOUNCE_DELAY_MS);
}, { deep: true });

const loadItems = async (page = null) => {
    try {
        loading.value = true;
        
        // Use the new search endpoint with PrimeVue filters format
        const result = await configurationItemsService.search({
            filters: filters.value,
            sortField: sortField.value,
            sortOrder: sortOrder.value,
            page: page || currentPage.value,
            limit: pageSize
        });
        
        items.value = result.data || [];
        totalRecords.value = result.total || 0;
        if (page) currentPage.value = page;
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItems.toast.error.title'), detail: t('configurationItems.toast.error.load'), life: 3000 });
    } finally {
        loading.value = false;
    }
};

const onPage = (event) => {
    const page = event.page + 1; // PrimeVue uses 0-based index
    loadItems(page);
};

const onSort = (event) => {
    console.log('[ConfigurationItemsCrud] onSort event:', event);
    console.log('[ConfigurationItemsCrud] sortField before:', sortField.value, '-> after:', event.sortField);
    console.log('[ConfigurationItemsCrud] sortOrder before:', sortOrder.value, '-> after:', event.sortOrder);
    // With v-model, values are already updated by PrimeVue
    // Just reload with current page reset to 1
    currentPage.value = 1;
    loadItems(1);
};

const clearFilters = () => {
    filters.value = initFilters();
};

const openNewTab = () => {
    // Generate unique ID for each new tab to allow multiple creations
    const uniqueId = `configuration-item-new-${Date.now()}`;
    tabsStore.openTab({
        id: uniqueId,
        label: t('configurationItems.tab.new'),
        icon: 'fas fa-plus',
        parentId: props.tabId,
        component: 'ConfigurationItemForm',
        mode: 'create',
        objectId: null
    });
};

const openEditTab = (itemData) => {
    tabsStore.openTab({
        id: `configuration-item-${itemData.uuid}`,
        label: itemData.name,
        icon: 'fas fa-edit',
        parentId: props.tabId,
        component: 'ConfigurationItemForm',
        mode: 'edit',
        objectId: itemData.uuid
    });
};

const confirmDeleteItem = (deleteItem) => {
    item.value = deleteItem;
    deleteItemDialog.value = true;
};

const deleteItem = async () => {
    try {
        await configurationItemsService.delete(item.value.uuid);
        deleteItemDialog.value = false;
        item.value = {};
        toast.add({ severity: 'success', summary: t('configurationItems.toast.success.title'), detail: t('configurationItems.toast.success.delete'), life: 3000 });
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItems.toast.error.title'), detail: t('configurationItems.toast.error.delete'), life: 3000 });
    }
};

const exportCSV = () => {
    dt.value.exportCSV();
};

const confirmDeleteSelected = () => {
    deleteItemsDialog.value = true;
};

const deleteSelectedItems = async () => {
    try {
        await Promise.all(selectedItems.value.map(item => configurationItemsService.delete(item.uuid)));
        deleteItemsDialog.value = false;
        selectedItems.value = null;
        toast.add({ severity: 'success', summary: t('configurationItems.toast.success.title'), detail: t('configurationItems.toast.success.deleteMany'), life: 3000 });
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItems.toast.error.title'), detail: t('configurationItems.toast.error.deleteMany'), life: 3000 });
    }
};

const getTypeSeverity = (type) => {
    switch (type) {
        case 'UPS':
            return 'warn';
        case 'APPLICATION':
            return 'success';
        case 'SERVER':
            return 'info';
        case 'NETWORK_DEVICE':
            return 'secondary';
        default:
            return null;
    }
};

const onRowContextMenu = (event) => {
    cm.value.show(event.originalEvent);
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const onColumnReorder = (event) => {
    console.log('[ConfigurationItemsCrud] Column reorder event:', event);
    console.log('[ConfigurationItemsCrud] New column order:', event.columns?.map(c => c.props?.field || c.props?.selectionMode || 'unknown'));
};

const onStateRestore = (event) => {
    console.log('[ConfigurationItemsCrud] State restored from localStorage:', event);
    const savedState = localStorage.getItem('configuration-items-table');
    if (savedState) {
        const parsed = JSON.parse(savedState);
        console.log('[ConfigurationItemsCrud] Saved columnOrder:', parsed.columnOrder);
        console.log('[ConfigurationItemsCrud] Full saved state:', parsed);
    }
};

const onStateSave = (event) => {
    console.log('[ConfigurationItemsCrud] State saved to localStorage:', event);
    console.log('[ConfigurationItemsCrud] columnOrder in state:', event.columnOrder);
    console.log('[ConfigurationItemsCrud] columnWidths in state:', event.columnWidths);
};

const onCellEditComplete = async (event) => {
    const { data, newValue, field } = event;
    
    // Skip if value hasn't changed
    if (data[field] === newValue) return;
    
    try {
        // Update the item via API
        await configurationItemsService.update(data.uuid, { [field]: newValue });
        
        // Update local data
        data[field] = newValue;
        
        toast.add({ 
            severity: 'success', 
            summary: t('configurationItems.toast.success.title'), 
            detail: t('configurationItems.toast.success.update'), 
            life: 3000 
        });
    } catch (error) {
        // Revert the change on error
        event.preventDefault();
        toast.add({ 
            severity: 'error', 
            summary: t('configurationItems.toast.error.title'), 
            detail: t('configurationItems.toast.error.update'), 
            life: 3000 
        });
    }
};
</script>

<style scoped>
/* DataTable flex layout for scrollable content */
:deep(.p-datatable) {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

:deep(.p-datatable-wrapper) {
    flex: 1;
    min-height: 0;
}

/* Disable all transitions to prevent theme change animations */
:deep(*),
:deep(*::before),
:deep(*::after) {
    transition: none !important;
}
</style>
