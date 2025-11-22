<template>
    <div class="configuration-items-crud">
        <div class="card">
            <Toolbar class="mb-6">
                <template #start>
                    <Button label="New" icon="pi pi-plus" class="mr-2" @click="openNewTab" />
                    <Button label="Delete" icon="pi pi-trash" severity="danger" variant="outlined" @click="confirmDeleteSelected" :disabled="!selectedItems || !selectedItems.length" />
                </template>

                <template #end>
                    <Button label="Export" icon="pi pi-upload" severity="secondary" @click="exportCSV($event)" />
                </template>
            </Toolbar>

            <DataTable
                ref="dt"
                v-model:selection="selectedItems"
                :value="items"
                dataKey="uuid"
                :paginator="true"
                :rows="10"
                :filters="filters"
                :loading="loading"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 25, 50]"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} configuration items"
            >
                <template #header>
                    <div class="flex flex-wrap gap-2 items-center justify-between">
                        <h4 class="m-0">Manage Configuration Items</h4>
                        <div class="flex gap-2">
                            <Select v-model="selectedCiType" :options="ciTypes" optionLabel="label" optionValue="value" placeholder="Filter by Type" @change="loadItems" class="w-48" />
                            <IconField>
                                <InputIcon>
                                    <i class="pi pi-search" />
                                </InputIcon>
                                <InputText v-model="filters['global'].value" placeholder="Search..." @input="onSearch" />
                            </IconField>
                        </div>
                    </div>
                </template>

                <Column selectionMode="multiple" style="width: 3rem" :exportable="false"></Column>
                <Column field="name" header="Name" sortable style="min-width: 16rem"></Column>
                <Column field="ci_type" header="Type" sortable style="min-width: 10rem">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.ci_type" :severity="getTypeSeverity(slotProps.data.ci_type)" />
                    </template>
                </Column>
                <Column field="description" header="Description" sortable style="min-width: 20rem">
                    <template #body="slotProps">
                        <span class="text-ellipsis">{{ slotProps.data.description || '-' }}</span>
                    </template>
                </Column>
                <Column field="created_at" header="Created" sortable style="min-width: 12rem">
                    <template #body="slotProps">
                        {{ formatDate(slotProps.data.created_at) }}
                    </template>
                </Column>
                <Column :exportable="false" style="min-width: 12rem">
                    <template #body="slotProps">
                        <Button icon="pi pi-pencil" variant="outlined" rounded class="mr-2" @click="openEditTab(slotProps.data)" />
                        <Button icon="pi pi-trash" variant="outlined" rounded severity="danger" @click="confirmDeleteItem(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>
        </div>

        <Dialog v-model:visible="deleteItemDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span v-if="item">Are you sure you want to delete <b>{{ item.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteItemDialog = false" severity="secondary" variant="text" />
                <Button label="Yes" icon="pi pi-check" @click="deleteItem" severity="danger" />
            </template>
        </Dialog>

        <Dialog v-model:visible="deleteItemsDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="flex items-center gap-4">
                <i class="pi pi-exclamation-triangle !text-3xl" />
                <span>Are you sure you want to delete the selected configuration items?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" text @click="deleteItemsDialog = false" severity="secondary" variant="text" />
                <Button label="Yes" icon="pi pi-check" text @click="deleteSelectedItems" severity="danger" />
            </template>
        </Dialog>

        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { FilterMatchMode } from '@primevue/core/api';
import { useToast } from 'primevue/usetoast';
import { useTabsStore } from '@/stores/tabsStore';
import configurationItemsService from '@/services/configurationItemsService';
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

const props = defineProps({
    tabId: {
        type: String,
        required: true
    }
});

const toast = useToast();
const tabsStore = useTabsStore();
const dt = ref();
const items = ref([]);
const deleteItemDialog = ref(false);
const deleteItemsDialog = ref(false);
const item = ref({});
const selectedItems = ref();
const selectedCiType = ref(null);
const filters = ref({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS }
});
const loading = ref(false);

const ciTypes = ref([
    { label: 'All Types', value: null },
    { label: 'UPS', value: 'UPS' },
    { label: 'Application', value: 'APPLICATION' },
    { label: 'Server', value: 'SERVER' },
    { label: 'Network Device', value: 'NETWORK_DEVICE' },
    { label: 'Generic', value: 'GENERIC' }
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

const loadItems = async () => {
    try {
        loading.value = true;
        const result = await configurationItemsService.getAll({
            ci_type: selectedCiType.value,
            search: filters.value.global.value || ''
        });
        items.value = result.data || [];
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load configuration items', life: 3000 });
    } finally {
        loading.value = false;
    }
};

const onSearch = () => {
    loadItems();
};

const openNewTab = () => {
    // Generate unique ID for each new tab to allow multiple creations
    const uniqueId = `configuration-item-new-${Date.now()}`;
    tabsStore.openTab({
        id: uniqueId,
        label: 'New Configuration Item',
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
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Configuration Item Deleted', life: 3000 });
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete configuration item', life: 3000 });
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
        toast.add({ severity: 'success', summary: 'Successful', detail: 'Configuration Items Deleted', life: 3000 });
        await loadItems();
    } catch (error) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete configuration items', life: 3000 });
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

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};
</script>

<style scoped>
.configuration-items-crud {
    padding: 1rem;
}

.text-ellipsis {
    display: block;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
