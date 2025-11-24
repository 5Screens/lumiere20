<template>
    <div class="p-4">
        <ContextMenu ref="cm" :model="menuModel" @hide="selectedItem = null" />
        <div class="card">
            <Toolbar class="mb-6 !border-0 !bg-transparent">
                <template #start>
                    <ButtonGroup>
                        <Button :label="$t('configurationItems.actions.new')" icon="pi pi-plus" variant="outlined" @click="openNewTab" />
                        <Button :label="$t('configurationItems.actions.delete')" icon="pi pi-trash" severity="danger" variant="outlined" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
                    </ButtonGroup>
                </template>

                <template #end>
                    <Button :label="$t('configurationItems.actions.export')" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
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
                :globalFilterFields="['name', 'ci_type', 'description']"
                contextMenu
                @page="onPage"
                @sort="onSort"
                @rowContextmenu="onRowContextMenu"
                :sortField="sortField"
                :sortOrder="sortOrder"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configuration items"
            >
                <template #header>
                    <div class="flex justify-between">
                        <Button type="button" icon="pi pi-filter-slash" :label="$t('configurationItems.actions.clearFilters')" variant="outlined" @click="clearFilters()" />
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText v-model="filters['global'].value" :placeholder="$t('configurationItems.search.placeholder')" />
                        </IconField>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" :header="$t('configurationItems.table.columns.name')" sortable style="min-width: 16rem">
                    <template #body="{ data }">
                        {{ data.name }}
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" :placeholder="$t('configurationItems.search.placeholder')" />
                    </template>
                </Column>
                <Column field="ci_type" :header="$t('configurationItems.table.columns.type')" sortable :filterMenuStyle="{ width: '14rem' }" style="min-width: 10rem">
                    <template #body="{ data }">
                        <Tag :value="data.ci_type" :severity="getTypeSeverity(data.ci_type)" />
                    </template>
                    <template #filter="{ filterModel }">
                        <Select v-model="filterModel.value" :options="ciTypeOptions" optionLabel="label" optionValue="value" :placeholder="$t('configurationItems.filter.placeholder')" showClear>
                            <template #option="slotProps">
                                <Tag :value="slotProps.option.value" :severity="getTypeSeverity(slotProps.option.value)" />
                            </template>
                        </Select>
                    </template>
                </Column>
                <Column field="description" :header="$t('configurationItems.table.columns.description')" sortable style="min-width: 20rem">
                    <template #body="{ data }">
                        <span class="block max-w-[300px] truncate">{{ data.description || '-' }}</span>
                    </template>
                    <template #filter="{ filterModel }">
                        <InputText v-model="filterModel.value" type="text" :placeholder="$t('configurationItems.search.placeholder')" />
                    </template>
                </Column>
                <Column field="created_at" :header="$t('configurationItems.table.columns.created')" sortable dataType="date" style="min-width: 12rem">
                    <template #body="{ data }">
                        {{ formatDate(data.created_at) }}
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

        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
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

const props = defineProps({
    tabId: {
        type: String,
        required: true
    }
});

const toast = useToast();
const { t } = useI18n();
const tabsStore = useTabsStore();
const cm = ref();
const dt = ref();
const items = ref([]);
const deleteItemDialog = ref(false);
const deleteItemsDialog = ref(false);
const item = ref({});
const selectedItem = ref();
const selectedItems = ref();
let searchTimeout = null;

const initFilters = () => {
    return {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        name: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
        ci_type: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
        description: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.CONTAINS }] }
    };
};

const filters = ref(initFilters());
const loading = ref(false);
const totalRecords = ref(0);
const currentPage = ref(1);
const pageSize = PAGINATION_CONFIG.pageSizes['Configuration_items'] || 25;
const sortField = ref('name');
const sortOrder = ref(1); // 1 for asc, -1 for desc

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

onMounted(async () => {
    console.log('[ConfigurationItemsCrud] Mounted with tabId:', props.tabId);
    await loadItems();
});

// Watch for child tabs closing to reload data
watch(() => tabsStore.activeChildTabs.length, (newLength, oldLength) => {
    // If a child tab was closed (length decreased), reload items
    if (newLength < oldLength) {
        loadItems();
    }
});

// Watch for global filter changes to trigger search with debounce
watch(() => filters.value.global.value, () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        loadItems(1);
    }, DEBOUNCE_DELAY_MS);
});

const loadItems = async (page = null) => {
    try {
        loading.value = true;
        const result = await configurationItemsService.getAll({
            search: filters.value.global.value || '',
            page: page || currentPage.value,
            limit: pageSize,
            sortBy: sortField.value,
            sortDirection: sortOrder.value === 1 ? 'asc' : 'desc'
        });
        items.value = result.data || [];
        totalRecords.value = result.pagination?.total || 0;
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
    sortField.value = event.sortField;
    sortOrder.value = event.sortOrder;
    loadItems();
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
</script>

<style scoped>
/* No custom styles needed - using Tailwind classes */
</style>
