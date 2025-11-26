<template>
    <div class="configuration-item-form">
        <div class="form-header">
            <h2>{{ mode === 'create' ? $t('configurationItemForm.title.create') : $t('configurationItemForm.title.edit') }}</h2>
        </div>

        <div class="form-content">
            <div class="form-section">
                <h3>{{ $t('configurationItemForm.sections.basicInfo') }}</h3>
                
                <div class="form-field">
                    <label for="name" class="required">{{ $t('configurationItemForm.fields.name.label') }}</label>
                    <InputText 
                        id="name" 
                        v-model.trim="formData.name" 
                        :invalid="submitted && !formData.name"
                        fluid 
                    />
                    <small v-if="submitted && !formData.name" class="error-message">{{ $t('configurationItemForm.fields.name.required') }}</small>
                </div>

                <div class="form-field">
                    <label for="description">{{ $t('configurationItemForm.fields.description.label') }}</label>
                    <Textarea 
                        id="description" 
                        v-model="formData.description" 
                        rows="3" 
                        fluid 
                    />
                </div>

                <div class="form-field">
                    <label for="ci_type" class="required">{{ $t('configurationItemForm.fields.type.label') }}</label>
                    <Select 
                        id="ci_type" 
                        v-model="formData.ci_type" 
                        :options="ciTypes" 
                        optionLabel="label" 
                        optionValue="value" 
                        :placeholder="$t('configurationItemForm.fields.type.placeholder')" 
                        fluid 
                        @change="onTypeChange"
                    />
                </div>
            </div>

            <!-- Extended Fields -->
            <div v-if="formData.ci_type && formData.ci_type !== 'GENERIC'" class="form-section">
                <h3>{{ $t('configurationItemForm.sections.extendedFields') }}</h3>
                
                <div v-for="field in getExtendedFields(formData.ci_type)" :key="field.name" class="form-field">
                    <label :for="field.name" :class="{ required: field.required }">
                        {{ field.label }}
                    </label>
                    
                    <InputText 
                        v-if="field.type === 'string'" 
                        :id="field.name" 
                        v-model="formData.extended_core_fields[field.name]" 
                        fluid 
                    />
                    
                    <InputNumber 
                        v-else-if="field.type === 'number'" 
                        :id="field.name" 
                        v-model="formData.extended_core_fields[field.name]" 
                        fluid 
                    />
                    
                    <Checkbox 
                        v-else-if="field.type === 'boolean'" 
                        :id="field.name" 
                        v-model="formData.extended_core_fields[field.name]" 
                        :binary="true"
                    />
                </div>
            </div>
        </div>

        <div class="form-actions">
            <Button :label="$t('configurationItemForm.actions.cancel')" icon="pi pi-times" severity="secondary" @click="handleCancel" />
            <Button :label="$t('configurationItemForm.actions.save')" icon="pi pi-check" @click="handleSave" :loading="saving" />
        </div>

        <Toast />
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useI18n } from 'vue-i18n';
import { useTabsStore } from '@/stores/tabsStore';
import configurationItemsService from '@/services/configurationItemsService';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const props = defineProps({
    mode: {
        type: String,
        required: true,
        validator: (value) => ['create', 'edit'].includes(value)
    },
    objectId: {
        type: String,
        default: null
    },
    tabId: {
        type: String,
        required: true
    }
});

const toast = useToast();
const { t } = useI18n();
const tabsStore = useTabsStore();

const formData = ref({
    name: '',
    description: '',
    ci_type: 'GENERIC',
    extended_core_fields: {}
});

const submitted = ref(false);
const saving = ref(false);
const schemas = ref({});

const ciTypes = ref([
    { label: t('configurationItems.types.ups'), value: 'UPS' },
    { label: t('configurationItems.types.application'), value: 'APPLICATION' },
    { label: t('configurationItems.types.server'), value: 'SERVER' },
    { label: t('configurationItems.types.networkDevice'), value: 'NETWORK_DEVICE' },
    { label: t('configurationItems.types.generic'), value: 'GENERIC' }
]);

onMounted(async () => {
    console.log('[ConfigurationItemForm] Mounted with props:', { mode: props.mode, objectId: props.objectId, tabId: props.tabId });
    
    await loadSchemas();
    
    if (props.mode === 'edit' && props.objectId) {
        console.log('[ConfigurationItemForm] Loading item:', props.objectId);
        await loadItem();
    }
});

const loadSchemas = async () => {
    try {
        schemas.value = await configurationItemsService.getSchemas();
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItemForm.toast.error.title'), detail: t('configurationItemForm.toast.error.loadSchemas'), life: 3000 });
    }
};

const loadItem = async () => {
    try {
        const item = await configurationItemsService.getById(props.objectId);
        formData.value = {
            ...item,
            extended_core_fields: item.extended_core_fields || {}
        };
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItemForm.toast.error.title'), detail: t('configurationItemForm.toast.error.loadItem'), life: 3000 });
    }
};

const onTypeChange = () => {
    formData.value.extended_core_fields = {};
};

const getExtendedFields = (ciType) => {
    const schema = schemas.value[ciType];
    if (!schema) return [];
    
    const fields = [];
    const allFields = [...schema.required, ...schema.optional];
    
    allFields.forEach(fieldName => {
        fields.push({
            name: fieldName,
            label: fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: schema.types[fieldName],
            required: schema.required.includes(fieldName)
        });
    });
    
    return fields;
};

const handleSave = async () => {
    submitted.value = true;

    if (!formData.value.name?.trim()) {
        toast.add({ severity: 'warn', summary: t('configurationItemForm.toast.validation.title'), detail: t('configurationItemForm.toast.validation.nameRequired'), life: 3000 });
        return;
    }

    try {
        saving.value = true;
        
        if (props.mode === 'edit') {
            await configurationItemsService.update(props.objectId, formData.value);
            toast.add({ severity: 'success', summary: t('configurationItemForm.toast.success.title'), detail: t('configurationItemForm.toast.success.update'), life: 3000 });
        } else {
            await configurationItemsService.create(formData.value);
            toast.add({ severity: 'success', summary: t('configurationItemForm.toast.success.title'), detail: t('configurationItemForm.toast.success.create'), life: 3000 });
        }
        
        // Close the tab after successful save
        tabsStore.closeTab(props.tabId);
    } catch (error) {
        toast.add({ severity: 'error', summary: t('configurationItemForm.toast.error.title'), detail: error.message || t('configurationItemForm.toast.error.save'), life: 3000 });
    } finally {
        saving.value = false;
    }
};

const handleCancel = () => {
    tabsStore.closeTab(props.tabId);
};
</script>

<style scoped>
.configuration-item-form,
.configuration-item-form *,
.configuration-item-form *::before,
.configuration-item-form *::after {
    transition: none !important;
}

.configuration-item-form {
    padding: 1.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bg-color);
}

.form-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}

.form-header h2 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.5rem;
}

.form-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 0.5rem;
}

.form-section {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
}

.form-section h3 {
    margin: 0 0 1.5rem 0;
    color: var(--text-color);
    font-size: 1.1rem;
    font-weight: 600;
}

.form-field {
    margin-bottom: 1.5rem;
}

.form-field:last-child {
    margin-bottom: 0;
}

.form-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-color);
}

.form-field label.required::after {
    content: ' *';
    color: #ef4444;
}

.error-message {
    display: block;
    margin-top: 0.25rem;
    color: #ef4444;
    font-size: 0.875rem;
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border-color);
    margin-top: 1.5rem;
}
</style>
