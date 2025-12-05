<template>
  <div class="h-full flex flex-col overflow-hidden">
    <!-- Service not available message -->
    <div v-if="!serviceAvailable" class="flex-1 flex items-center justify-center">
      <div class="text-center p-8">
        <i class="pi pi-wrench text-5xl text-surface-400 mb-4" />
        <h3 class="text-xl font-semibold text-surface-600 dark:text-surface-300 mb-2">
          {{ $t('common.serviceNotAvailable') }}
        </h3>
        <p class="text-surface-500 dark:text-surface-400">
          {{ $t('common.serviceNotAvailableDesc', { type: objectType }) }}
        </p>
      </div>
    </div>

    <!-- Main content when service is available -->
    <template v-else>
      <!-- Context Menu -->
      <ContextMenu ref="cm" :model="menuModel" @hide="selectedItem = null" />
    
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
      <!-- Toolbar -->
      <Toolbar class="mb-4">
        <template #start>
          <ButtonGroup>
            <Button 
              :label="$t('common.create')" 
              icon="pi pi-plus" 
              severity="secondary" 
              @click="openCreateDialog" 
            />
            <Button 
              :label="$t('common.edit')" 
              icon="pi pi-pencil" 
              severity="secondary" 
              @click="openEditMultiple" 
              :disabled="!selectedItems || selectedItems.length === 0" 
            />
            <Button 
              :label="$t('common.delete')" 
              icon="pi pi-trash" 
              severity="secondary" 
              @click="confirmDeleteSelected" 
              :disabled="!selectedItems || !selectedItems.length" 
            />
          </ButtonGroup>
        </template>

        <template #end>
          <Button 
            :label="$t('common.export')" 
            icon="pi pi-file-export" 
            severity="secondary" 
            @click="exportCSV" 
          />
        </template>
      </Toolbar>

      <!-- DataTable -->
      <DataTable
        ref="dt"
        v-model:selection="selectedItems"
        v-model:contextMenuSelection="selectedItem"
        v-model:filters="filters"
        v-model:sortField="sortField"
        v-model:sortOrder="sortOrder"
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
        :globalFilterFields="['name', 'description']"
        resizableColumns
        columnResizeMode="expand"
        reorderableColumns
        :stateStorage="'local'"
        :stateKey="`${objectType}-table`"
        editMode="cell"
        @cellEditComplete="onCellEditComplete"
        contextMenu
        @page="onPage"
        @sort="onSort"
        @rowContextmenu="onRowContextMenu"
        @columnReorder="onColumnReorder"
        @stateRestore="onStateRestore"
        removableSort
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        :currentPageReportTemplate="paginationTemplate"
      >
        <!-- Header with search -->
        <template #header>
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <IconField>
                <InputIcon>
                  <i class="pi pi-search" />
                </InputIcon>
                <InputText 
                  v-model="filters['global'].value" 
                  :placeholder="$t('common.search')" 
                />
              </IconField>
              <Button 
                type="button" 
                icon="pi pi-filter-slash" 
                severity="secondary" 
                @click="clearFilters" 
                :disabled="!hasActiveFilters" 
              />
              <!-- Column toggle popover -->
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
              <Button 
                type="button" 
                icon="pi pi-cog" 
                severity="secondary" 
                @click="toggleColumnSelector" 
                v-tooltip.bottom="$t('common.columns')"
              />
              <Button 
                icon="pi pi-refresh" 
                severity="secondary" 
                @click="loadItems(1)" 
                :loading="loading" 
              />
            </div>
          </div>
        </template>

        <!-- Selection column -->
        <Column 
          field="_selection"
          selectionMode="multiple" 
          style="min-width: 3rem; width: 3rem" 
          :exportable="false" 
          :reorderableColumn="false"
          frozen 
        />
        
        <!-- Actions column -->
        <Column 
          field="_actions"
          style="min-width: 3rem; width: 3rem" 
          :exportable="false" 
          :reorderableColumn="false"
          frozen
        >
          <template #body="{ data }">
            <Button 
              icon="pi pi-pencil" 
              @click="openEditDialog(data)" 
              severity="secondary" 
              rounded 
              size="small" 
            />
          </template>
        </Column>

        <!-- Dynamic columns from metadata -->
        <template v-for="col in tableColumns" :key="col.field_name">
        <Column 
          v-if="isColumnVisible(col.field_name)"
          :field="col.field_name" 
          :header="$t(col.label_key)" 
          :sortable="col.is_sortable"
          :dataType="col.data_type === 'date' ? 'date' : undefined"
          :style="col.min_width ? `min-width: ${col.min_width}` : undefined"
        >
          <!-- Body template based on field type -->
          <template #body="{ data }">
            <!-- Boolean -->
            <template v-if="col.field_type === 'boolean'">
              <i :class="data[col.field_name] ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
            <!-- Select with Tag and color -->
            <template v-else-if="col.field_type === 'select'">
              <Tag 
                :value="formatCellValue(data[col.field_name], col)"
                :style="getTagStyle(getOptionByValue(col, data[col.field_name])?.color)"
              >
                <template #default>
                  <div class="flex items-center gap-2">
                    <i 
                      v-if="getOptionByValue(col, data[col.field_name])?.icon" 
                      :class="['pi', getOptionByValue(col, data[col.field_name])?.icon]" 
                    />
                    <span>{{ formatCellValue(data[col.field_name], col) }}</span>
                  </div>
                </template>
              </Tag>
            </template>
            <!-- Date/Datetime -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              {{ formatDate(data[col.field_name]) }}
            </template>
            <!-- Textarea (truncated) - with translation support -->
            <template v-else-if="col.field_type === 'textarea'">
              <span class="block max-w-xs truncate">
                {{ col.is_translatable ? getTranslatedValue(data, col.field_name) : (data[col.field_name] || '-') }}
              </span>
            </template>
            <!-- Tag Style display -->
            <template v-else-if="col.field_type === 'tag_style'">
              <Tag 
                v-if="data[col.field_name]"
                :style="getTagStyle(data[col.field_name])"
              >
                {{ data[col.field_name] }}
              </Tag>
              <span v-else>-</span>
            </template>
            <!-- Icon display -->
            <template v-else-if="col.field_type === 'icon_picker'">
              <div v-if="data[col.field_name]" class="flex items-center gap-2">
                <i :class="`pi ${data[col.field_name]}`" />
                <span class="text-sm text-surface-500">{{ data[col.field_name] }}</span>
              </div>
              <span v-else>-</span>
            </template>
            <!-- Default text - with translation support -->
            <template v-else>
              {{ col.is_translatable ? getTranslatedValue(data, col.field_name) : (data[col.field_name] ?? '-') }}
            </template>
          </template>
          
          <!-- Editor template (only for editable fields) -->
          <template v-if="col.is_editable" #editor="{ data, field }">
            <!-- Select editor -->
            <template v-if="col.field_type === 'select'">
              <Select 
                v-model="data[field]" 
                :options="getFieldOptions(col)" 
                optionLabel="label" 
                optionValue="value" 
                autofocus 
                fluid 
              >
                <template #value="slotProps">
                  <div 
                    v-if="slotProps.value" 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(getOptionByValue(col, slotProps.value)?.color)"
                  >
                    <i 
                      v-if="getOptionByValue(col, slotProps.value)?.icon" 
                      :class="['pi', getOptionByValue(col, slotProps.value)?.icon]" 
                    />
                    <span>{{ getOptionByValue(col, slotProps.value)?.label }}</span>
                  </div>
                </template>
                <template #option="slotProps">
                  <div 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(slotProps.option.color)"
                  >
                    <i 
                      v-if="slotProps.option.icon" 
                      :class="['pi', slotProps.option.icon]" 
                    />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
            </template>
            <!-- Boolean editor -->
            <template v-else-if="col.field_type === 'boolean'">
              <ToggleSwitch v-model="data[field]" />
            </template>
            <!-- Number editor -->
            <template v-else-if="col.field_type === 'number'">
              <InputNumber v-model="data[field]" autofocus fluid />
            </template>
            <!-- Icon picker editor -->
            <template v-else-if="col.field_type === 'icon_picker'">
              <Button
                type="button"
                severity="secondary"
                outlined
                size="small"
                class="w-full justify-between"
                @click="openInlinePicker('icon', data, field)"
              >
                <template #default>
                  <div class="flex items-center gap-2">
                    <template v-if="data[field]">
                      <i :class="`pi ${data[field]}`" />
                      <span class="text-sm">{{ data[field] }}</span>
                    </template>
                    <span v-else class="text-surface-400">{{ $t('common.selectIcon') }}</span>
                  </div>
                  <i class="pi pi-pencil text-surface-400 ml-2" />
                </template>
              </Button>
            </template>
            <!-- Tag style editor -->
            <template v-else-if="col.field_type === 'tag_style'">
              <Button
                type="button"
                severity="secondary"
                outlined
                size="small"
                class="w-full justify-between"
                @click="openInlinePicker('tag_style', data, field)"
              >
                <template #default>
                  <div class="flex items-center gap-2">
                    <Tag v-if="data[field]" :style="getTagStyle(data[field])" class="text-sm">
                      {{ data[field] }}
                    </Tag>
                    <span v-else class="text-surface-400">{{ $t('common.selectTagStyle') }}</span>
                  </div>
                  <i class="pi pi-pencil text-surface-400 ml-2" />
                </template>
              </Button>
            </template>
            <!-- Translatable field editor -->
            <template v-else-if="col.is_translatable">
              <Button
                type="button"
                severity="secondary"
                outlined
                size="small"
                class="w-full justify-between"
                @click="openInlinePicker('translatable', data, field, col)"
              >
                <template #default>
                  <span class="truncate text-left flex-1">
                    {{ getTranslatedValue(data, field) }}
                  </span>
                  <i class="pi pi-pencil text-surface-400 ml-2" />
                </template>
              </Button>
            </template>
            <!-- Default text editor -->
            <template v-else>
              <InputText v-model="data[field]" autofocus fluid />
            </template>
          </template>
          
          <!-- Filter template (only for filterable fields) -->
          <template v-if="col.is_filterable" #filter="{ filterModel }">
            <!-- Select filter -->
            <template v-if="col.field_type === 'select'">
              <Select 
                v-model="filterModel.value" 
                :options="getFieldOptions(col)" 
                optionLabel="label" 
                optionValue="value" 
                showClear
              >
                <template #option="slotProps">
                  <div 
                    class="flex items-center gap-2 px-2 py-1 rounded"
                    :style="getTagStyle(slotProps.option.color)"
                  >
                    <i 
                      v-if="slotProps.option.icon" 
                      :class="['pi', slotProps.option.icon]" 
                    />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
            </template>
            <!-- Date filter -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              <DatePicker v-model="filterModel.value" dateFormat="dd/mm/yy" showButtonBar />
            </template>
            <!-- Boolean filter -->
            <template v-else-if="col.field_type === 'boolean'">
              <Select 
                v-model="filterModel.value" 
                :options="[{ label: $t('common.yes'), value: true }, { label: $t('common.no'), value: false }]" 
                optionLabel="label" 
                optionValue="value" 
                showClear
              />
            </template>
            <!-- Default text filter -->
            <template v-else>
              <InputText v-model="filterModel.value" type="text" :placeholder="$t('common.search')" />
            </template>
          </template>
        </Column>
        </template>
      </DataTable>
    </div>

    <!-- Create/Edit Dialog with dynamic fields -->
    <Dialog 
      v-model:visible="itemDialog" 
      :style="{ width: '600px' }" 
      :header="dialogMode === 'create' ? $t('common.create') : $t('common.edit')" 
      :modal="true"
      position="right"
    >
      <div class="flex flex-col gap-4">
        <!-- Dynamic form fields from metadata -->
        <div 
          v-for="field in formFields" 
          :key="field.field_name" 
          class="flex flex-col gap-2"
        >
          <label :for="field.field_name" class="font-semibold">
            {{ $t(field.label_key) }}
            <span v-if="field.is_required" class="text-red-500">*</span>
          </label>
          
          <!-- Special CI Type selector for configuration_items -->
          <Select 
            v-if="isConfigurationItems && field.field_name === 'ci_type'"
            :id="field.field_name" 
            :modelValue="editItem[field.field_name]"
            @update:modelValue="handleCiTypeChange"
            :options="ciTypes" 
            optionLabel="label" 
            optionValue="value" 
            :disabled="field.is_readonly"
            :loading="extendedFieldsLoading"
            fluid
          >
            <template #value="slotProps">
              <div 
                v-if="slotProps.value" 
                class="flex items-center gap-2"
              >
                <i 
                  v-if="ciTypes.find(ct => ct.value === slotProps.value)?.icon" 
                  :class="['pi', ciTypes.find(ct => ct.value === slotProps.value)?.icon]" 
                />
                <span>{{ ciTypes.find(ct => ct.value === slotProps.value)?.label }}</span>
              </div>
              <span v-else>{{ $t('configurationItems.selectType') }}</span>
            </template>
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <i 
                  v-if="slotProps.option.icon" 
                  :class="['pi', slotProps.option.icon]" 
                />
                <span>{{ slotProps.option.label }}</span>
              </div>
            </template>
          </Select>
          
          <!-- Text input -->
          <InputText 
            v-else-if="field.field_type === 'text'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :maxlength="field.max_length"
            fluid 
          />
          
          <!-- Textarea -->
          <Textarea 
            v-else-if="field.field_type === 'textarea'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            rows="3" 
            fluid 
          />
          
          <!-- Number input -->
          <InputNumber 
            v-else-if="field.field_type === 'number'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :min="field.min_value"
            :max="field.max_value"
            fluid 
          />
          
          <!-- Select with refresh button -->
          <div v-else-if="field.field_type === 'select'" class="flex gap-2">
            <Select 
              :id="field.field_name" 
              v-model="editItem[field.field_name]" 
              :options="getFieldOptions(field)" 
              optionLabel="label" 
              optionValue="value" 
              :disabled="field.is_readonly"
              :loading="refreshingField === field.field_name"
              class="flex-1"
            >
              <template #value="slotProps">
                <div 
                  v-if="slotProps.value" 
                  class="flex items-center gap-2 px-2 py-1 rounded"
                  :style="getTagStyle(getOptionByValue(field, slotProps.value)?.color)"
                >
                  <i 
                    v-if="getOptionByValue(field, slotProps.value)?.icon" 
                    :class="['pi', getOptionByValue(field, slotProps.value)?.icon]" 
                  />
                  <span>{{ getOptionByValue(field, slotProps.value)?.label }}</span>
                </div>
                <span v-else>{{ slotProps.placeholder }}</span>
              </template>
              <template #option="slotProps">
                <div 
                  class="flex items-center gap-2 px-2 py-1 rounded"
                  :style="getTagStyle(slotProps.option.color)"
                >
                  <i 
                    v-if="slotProps.option.icon" 
                    :class="['pi', slotProps.option.icon]" 
                  />
                  <span>{{ slotProps.option.label }}</span>
                </div>
              </template>
            </Select>
            <Button 
              v-if="isApiOptionsSource(field)"
              icon="pi pi-refresh" 
              severity="secondary" 
              @click="refreshFieldOptions(field)"
              :loading="refreshingField === field.field_name"
              v-tooltip.top="$t('common.refresh')"
            />
          </div>
          
          <!-- Boolean toggle -->
          <ToggleSwitch 
            v-else-if="field.field_type === 'boolean'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
          
          <!-- Date picker -->
          <DatePicker 
            v-else-if="field.field_type === 'date'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            fluid 
          />
          
          <!-- Datetime picker -->
          <DatePicker 
            v-else-if="field.field_type === 'datetime'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            dateFormat="dd/mm/yy"
            showTime
            fluid 
          />
          
          <!-- Relation (placeholder - will need autocomplete) -->
          <InputText 
            v-else-if="field.field_type === 'relation'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
            :placeholder="`Select ${field.relation_object}...`"
            fluid 
          />
          
          <!-- Tag Style Selector -->
          <TagStyleSelector 
            v-else-if="field.field_type === 'tag_style'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
          
          <!-- Icon Picker -->
          <IconSelector 
            v-else-if="field.field_type === 'icon_picker'"
            :id="field.field_name" 
            v-model="editItem[field.field_name]" 
            :disabled="field.is_readonly"
          />
        </div>
        
        <!-- Extended fields section for configuration_items -->
        <template v-if="isConfigurationItems && extendedFields.length > 0">
          <div class="border-t border-surface-200 dark:border-surface-700 pt-4 mt-2">
            <h4 class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-4">
              {{ $t('configurationItems.extendedFields') }}
            </h4>
            
            <!-- Loading state -->
            <div v-if="extendedFieldsLoading" class="flex items-center gap-2 text-surface-500">
              <i class="pi pi-spin pi-spinner" />
              <span>{{ $t('common.loading') }}</span>
            </div>
            
            <!-- Extended fields -->
            <div 
              v-else
              v-for="field in extendedFields" 
              :key="field.field_name" 
              class="flex flex-col gap-2 mb-4"
            >
              <label :for="'ext_' + field.field_name" class="font-semibold text-sm">
                {{ field.label }}
                <span v-if="field.is_required" class="text-red-500">*</span>
                <span v-if="field.unit" class="text-surface-400 font-normal">({{ field.unit }})</span>
              </label>
              
              <!-- Text input -->
              <InputText 
                v-if="field.field_type === 'text'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
                :maxlength="field.max_length"
                :placeholder="field.pattern ? `Format: ${field.pattern}` : ''"
                fluid 
              />
              
              <!-- Textarea -->
              <Textarea 
                v-else-if="field.field_type === 'textarea'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
                rows="3" 
                fluid 
              />
              
              <!-- Number input -->
              <InputNumber 
                v-else-if="field.field_type === 'number'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
                :min="field.min_value"
                :max="field.max_value"
                fluid 
              />
              
              <!-- Select -->
              <Select 
                v-else-if="field.field_type === 'select'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :options="getExtendedFieldOptions(field)" 
                optionLabel="label" 
                optionValue="value" 
                :disabled="field.is_readonly"
                fluid
              />
              
              <!-- Multiselect -->
              <MultiSelect 
                v-else-if="field.field_type === 'multiselect'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name) || []"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :options="getExtendedFieldOptions(field)" 
                optionLabel="label" 
                optionValue="value" 
                :disabled="field.is_readonly"
                display="chip"
                fluid
              />
              
              <!-- Boolean toggle -->
              <ToggleSwitch 
                v-else-if="field.field_type === 'boolean'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name) || false"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
              />
              
              <!-- Date picker -->
              <DatePicker 
                v-else-if="field.field_type === 'date'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
                dateFormat="dd/mm/yy"
                fluid 
              />
              
              <!-- Datetime picker -->
              <DatePicker 
                v-else-if="field.field_type === 'datetime'"
                :id="'ext_' + field.field_name" 
                :modelValue="getExtendedFieldValue(field.field_name)"
                @update:modelValue="setExtendedFieldValue(field.field_name, $event)"
                :disabled="field.is_readonly"
                dateFormat="dd/mm/yy"
                showTime
                fluid 
              />
            </div>
          </div>
        </template>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" severity="secondary" text @click="itemDialog = false" />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="saveItem" :loading="saving" />
      </template>
    </Dialog>
    
    <!-- CI Type Change Confirmation Dialog -->
    <Dialog 
      v-model:visible="changeTypeDialog" 
      :style="{ width: '450px' }" 
      :header="$t('configurationItems.changeTypeTitle')" 
      :modal="true"
    >
      <div class="flex items-start gap-4">
        <i class="pi pi-exclamation-triangle text-4xl text-orange-500" />
        <div>
          <p class="font-semibold mb-2">{{ $t('configurationItems.changeTypeWarning') }}</p>
          <p class="text-sm text-surface-600 dark:text-surface-400">
            {{ $t('configurationItems.changeTypeDescription') }}
          </p>
        </div>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" severity="secondary" text @click="cancelCiTypeChange" />
        <Button :label="$t('common.confirm')" icon="pi pi-check" severity="warning" @click="confirmCiTypeChange" />
      </template>
    </Dialog>

    <!-- Delete Confirmation Dialog -->
    <Dialog 
      v-model:visible="deleteDialog" 
      :style="{ width: '450px' }" 
      :header="$t('common.delete')" 
      :modal="true"
    >
      <div class="flex items-center gap-4">
        <i class="pi pi-exclamation-triangle text-3xl text-orange-500" />
        <span v-if="selectedItems?.length === 1">
          {{ $t('common.confirmDelete') }}
        </span>
        <span v-else>
          {{ $t('common.confirmDeleteMultiple', { count: selectedItems?.length }) }}
        </span>
      </div>
      <template #footer>
        <Button :label="$t('common.no')" icon="pi pi-times" severity="secondary" text @click="deleteDialog = false" />
        <Button :label="$t('common.yes')" icon="pi pi-check" severity="danger" @click="deleteSelectedItems" :loading="deleting" />
      </template>
    </Dialog>

    <!-- Inline Icon Picker Dialog -->
    <Dialog
      v-model:visible="inlineIconDialog"
      modal
      :header="$t('common.selectIcon')"
      :style="{ width: '90vw', height: '90vh' }"
      :draggable="false"
    >
      <!-- Search bar -->
      <div class="mb-4 flex gap-2">
        <IconField class="flex-1">
          <InputIcon class="pi pi-search" />
          <InputText
            v-model="iconSearchQuery"
            :placeholder="$t('common.searchIcon')"
            class="w-full"
          />
        </IconField>
        <Button
          v-if="iconSearchQuery"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="iconSearchQuery = ''"
        />
      </div>

      <!-- Icons grid -->
      <div class="overflow-auto" style="height: calc(90vh - 180px);">
        <template v-if="iconSearchQuery">
          <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            <button
              v-for="icon in filteredIconsForInline"
              :key="icon"
              type="button"
              class="icon-item p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
              :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': inlinePickerValue === icon }"
              @click="inlinePickerValue = icon"
            >
              <i :class="`pi ${icon} text-xl`" />
              <span class="text-xs text-surface-500 truncate w-full text-center">{{ icon.replace('pi-', '') }}</span>
            </button>
          </div>
          <div v-if="filteredIconsForInline.length === 0" class="text-center py-8 text-surface-500">
            {{ $t('common.noResults') }}
          </div>
        </template>
        <template v-else>
          <div v-for="(category, key) in iconCategories" :key="key" class="mb-6">
            <h3 class="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-2 sticky top-0 bg-surface-0 dark:bg-surface-900 py-2 z-10">
              {{ category.label }}
            </h3>
            <div class="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              <button
                v-for="icon in category.icons"
                :key="icon"
                type="button"
                class="icon-item p-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-1"
                :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': inlinePickerValue === icon }"
                @click="inlinePickerValue = icon"
              >
                <i :class="`pi ${icon} text-xl`" />
                <span class="text-xs text-surface-500 truncate w-full text-center">{{ icon.replace('pi-', '') }}</span>
              </button>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <div class="flex justify-between items-center w-full">
          <div class="text-sm text-surface-500">
            <span v-if="inlinePickerValue">
              {{ $t('common.selected') }}: <i :class="`pi ${inlinePickerValue} mx-1`" /> {{ inlinePickerValue }}
            </span>
          </div>
          <div class="flex gap-2">
            <Button :label="$t('common.clear')" severity="secondary" text @click="inlinePickerValue = null" />
            <Button :label="$t('common.cancel')" severity="secondary" @click="cancelInlinePicker" />
            <Button :label="$t('common.confirm')" @click="confirmInlinePicker" :loading="inlinePickerSaving" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Inline Tag Style Picker Dialog -->
    <Dialog
      v-model:visible="inlineTagStyleDialog"
      modal
      :header="$t('common.selectTagStyle')"
      :style="{ width: '90vw', maxWidth: '900px', height: '80vh' }"
      :draggable="false"
    >
      <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 overflow-auto" style="max-height: calc(80vh - 120px);">
        <button
          v-for="option in tagStyleOptions"
          :key="option.value"
          type="button"
          class="style-item p-4 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-300 dark:hover:border-primary-700 transition-all cursor-pointer flex flex-col items-center gap-2"
          :class="{ 'bg-primary-100 dark:bg-primary-900/40 border-primary-500': inlinePickerValue === option.value }"
          @click="inlinePickerValue = option.value"
        >
          <Tag :style="option.style" class="text-sm px-4 py-2">{{ option.label }}</Tag>
          <i v-if="inlinePickerValue === option.value" class="pi pi-check text-primary-500" />
        </button>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button :label="$t('common.clear')" severity="secondary" text @click="inlinePickerValue = null" />
          <Button :label="$t('common.cancel')" severity="secondary" @click="cancelInlinePicker" />
          <Button :label="$t('common.confirm')" @click="confirmInlinePicker" :loading="inlinePickerSaving" />
        </div>
      </template>
    </Dialog>

    <!-- Inline Translatable Field Dialog -->
    <Dialog
      v-model:visible="inlineTranslatableDialog"
      modal
      :header="inlineTranslatableTitle"
      :style="{ width: '500px' }"
      :draggable="false"
    >
      <div class="flex flex-col gap-4">
        <!-- One field per language -->
        <div 
          v-for="lang in availableLanguages" 
          :key="lang.code"
          class="flex flex-col gap-2"
        >
          <label :for="`trans-inline-${lang.code}`" class="flex items-center gap-2 font-medium">
            <span class="text-xl" :title="lang.name">{{ lang.flag }}</span>
            <span>{{ lang.name }}</span>
          </label>
          
          <!-- Textarea for textarea fields -->
          <Textarea
            v-if="inlinePickerFieldMeta?.field_type === 'textarea'"
            :id="`trans-inline-${lang.code}`"
            v-model="inlineTranslations[lang.code]"
            rows="3"
            class="w-full"
            :placeholder="`${lang.name}...`"
          />
          <!-- InputText for text fields -->
          <InputText
            v-else
            :id="`trans-inline-${lang.code}`"
            v-model="inlineTranslations[lang.code]"
            class="w-full"
            :placeholder="`${lang.name}...`"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button :label="$t('common.cancel')" severity="secondary" @click="cancelInlinePicker" />
          <Button :label="$t('common.confirm')" @click="confirmInlineTranslatable" :loading="inlinePickerSaving" />
        </div>
      </template>
    </Dialog>

    <!-- Toast -->
    <Toast position="bottom-right" />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { FilterMatchMode, FilterOperator } from '@primevue/core/api'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { getService, hasService } from '@/services'
import metadataService from '@/services/metadataService'
import ciTypeFieldsService from '@/services/ciTypeFieldsService'
import ciTypesService from '@/services/ciTypesService'
import { useTabsStore } from '@/stores/tabsStore'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Toolbar from 'primevue/toolbar'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'
import ContextMenu from 'primevue/contextmenu'
import DatePicker from 'primevue/datepicker'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import MultiSelect from 'primevue/multiselect'

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'
import TranslatableInput from '@/components/form/TranslatableInput.vue'

// Utils
import { getTagStyle, getColorValue, getTagStyleOptions } from '@/utils/tagStyles'
import { iconCategories, searchIcons } from '@/utils/primeIcons'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  tabId: {
    type: String,
    default: null
  }
})

// Stores
const tabsStore = useTabsStore()

// Get service for this object type
const service = computed(() => getService(props.objectType))
const serviceAvailable = computed(() => hasService(props.objectType))

// Metadata
const objectTypeMetadata = ref(null)
const tableColumns = ref([])
const formFields = ref([])
const metadataLoading = ref(true)
const fieldOptions = ref({}) // Cache for field options (including API-loaded ones)

// Composables
const toast = useToast()
const { t, locale } = useI18n()

// Refs
const dt = ref()
const cm = ref()
const columnTogglePopover = ref()
const items = ref([])
const selectedItems = ref([])
const selectedItem = ref(null)
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const refreshingField = ref(null)

// Pagination
const totalRecords = ref(0)
const currentPage = ref(1)
const pageSize = 25
const sortField = ref('updated_at')
const sortOrder = ref(-1)

// Dialogs
const itemDialog = ref(false)
const deleteDialog = ref(false)
const dialogMode = ref('create')
const editItem = ref({})

// Extended fields for configuration_items
const extendedFields = ref([])
const extendedFieldsLoading = ref(false)
const ciTypes = ref([])
const ciTypesLoaded = ref(false)
const changeTypeDialog = ref(false)
const pendingCiType = ref(null)

// Inline picker dialogs
const inlineIconDialog = ref(false)
const inlineTagStyleDialog = ref(false)
const inlineTranslatableDialog = ref(false)
const inlinePickerData = ref(null) // The row data being edited
const inlinePickerField = ref(null) // The field name being edited
const inlinePickerFieldMeta = ref(null) // The field metadata (for translatable)
const inlinePickerValue = ref(null) // The temporary selected value
const inlinePickerSaving = ref(false)
const iconSearchQuery = ref('')
const tagStyleOptions = getTagStyleOptions()

// Translatable field support
const inlineTranslations = ref({}) // Temporary translations { fr: '...', en: '...' }
const availableLanguages = ref([])

// Convert country code to flag emoji (e.g., 'fr' -> '🇫🇷')
const getFlagEmoji = (countryCode) => {
  if (!countryCode) return '🏳️'
  const code = countryCode.toUpperCase()
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
}

// Load active languages from API
const loadActiveLanguages = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/languages/active`)
    const data = await response.json()
    availableLanguages.value = data.map(lang => ({
      code: lang.code,
      name: lang.name,
      flag: getFlagEmoji(lang.flag_code)
    }))
  } catch (error) {
    console.error('Failed to load active languages:', error)
    // Fallback to default languages if API fails
    availableLanguages.value = [
      { code: 'en', name: 'English', flag: '🇬🇧' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ]
  }
}

// Filters - built dynamically from metadata
const initFilters = () => {
  const baseFilters = {
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
  }
  
  // Add filters for each column
  for (const col of tableColumns.value) {
    if (col.is_filterable) {
      const matchMode = getDefaultMatchMode(col)
      baseFilters[col.field_name] = {
        operator: col.field_type === 'select' ? FilterOperator.OR : FilterOperator.AND,
        constraints: [{ value: null, matchMode }]
      }
    }
  }
  
  return baseFilters
}

const getDefaultMatchMode = (col) => {
  switch (col.field_type) {
    case 'select':
      return FilterMatchMode.EQUALS
    case 'date':
    case 'datetime':
      return FilterMatchMode.DATE_IS
    case 'number':
      return FilterMatchMode.EQUALS
    case 'boolean':
      return FilterMatchMode.EQUALS
    default:
      return FilterMatchMode.CONTAINS
  }
}

const filters = ref({ global: { value: null, matchMode: FilterMatchMode.CONTAINS } })

// Context menu
const menuModel = ref([
  { label: t('common.edit'), icon: 'pi pi-pencil', command: () => openEditDialog(selectedItem.value) },
  { label: t('common.delete'), icon: 'pi pi-trash', command: () => confirmDeleteSelected() }
])

// Column toggle - built from metadata
const toggleableColumns = computed(() => {
  return tableColumns.value.map(col => ({
    field: col.field_name,
    header: t(col.label_key)
  }))
})

const selectedColumns = ref([])

const isColumnVisible = (field) => {
  return selectedColumns.value.some(col => col.field === field)
}

const toggleColumnSelector = (event) => {
  columnTogglePopover.value.toggle(event)
}

// Get options for select fields (from cache)
const getFieldOptions = (field) => {
  if (!field.options_source) return []
  return fieldOptions.value[field.field_name] || []
}

// Load options for a field (handles both static JSON and API endpoints)
const loadFieldOptions = async (field, useCache = true) => {
  if (!field.options_source) return
  
  let options = []
  
  if (metadataService.isApiEndpoint(field.options_source)) {
    // Load from API
    console.log(`[ObjectsCrud] Loading options from API: ${field.options_source}, useCache: ${useCache}`)
    options = await metadataService.fetchOptions(field.options_source, useCache)
    console.log(`[ObjectsCrud] Loaded ${options.length} options`)
  } else {
    // Parse static JSON
    options = metadataService.parseOptions(field.options_source)
  }
  
  // Transform options: if label_key exists, translate it to label
  fieldOptions.value[field.field_name] = options.map(opt => {
    if (opt.label_key) {
      return { ...opt, label: t(opt.label_key) }
    }
    return opt
  })
}

// Load all field options for select fields
const loadAllFieldOptions = async (fields) => {
  const selectFields = fields.filter(f => f.field_type === 'select' && f.options_source)
  await Promise.all(selectFields.map(f => loadFieldOptions(f)))
}

// Check if field options come from API (not static JSON)
const isApiOptionsSource = (field) => {
  return field.options_source && metadataService.isApiEndpoint(field.options_source)
}

// Refresh options for a specific field
const refreshFieldOptions = async (field) => {
  if (!field.options_source) return
  
  console.log(`[ObjectsCrud] Refreshing options for field: ${field.field_name}`)
  
  try {
    refreshingField.value = field.field_name
    // Pass useCache = false to force reload from API
    await loadFieldOptions(field, false)
    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: t('common.optionsRefreshed'), 
      life: 2000 
    })
  } catch (error) {
    console.error('Failed to refresh field options:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Failed to refresh options', 
      life: 3000 
    })
  } finally {
    refreshingField.value = null
  }
}

// Computed
const hasActiveFilters = computed(() => {
  if (filters.value.global?.value) return true
  for (const col of tableColumns.value) {
    const filter = filters.value[col.field_name]
    if (filter?.constraints) {
      for (const constraint of filter.constraints) {
        if (constraint.value !== null && constraint.value !== undefined && constraint.value !== '') {
          return true
        }
      }
    }
  }
  return false
})

const paginationTemplate = computed(() => {
  const templates = {
    fr: 'Affichage de {first} à {last} sur {totalRecords} éléments',
    en: 'Showing {first} to {last} of {totalRecords} items'
  }
  return templates[locale.value] || templates.en
})

// Filtered icons for inline picker
const filteredIconsForInline = computed(() => {
  return searchIcons(iconSearchQuery.value)
})

// Title for translatable dialog
const inlineTranslatableTitle = computed(() => {
  if (inlinePickerFieldMeta.value?.label_key) {
    return `${t('common.translate')} - ${t(inlinePickerFieldMeta.value.label_key)}`
  }
  return t('common.translate')
})

// Methods

// Inline picker methods
const openInlinePicker = (type, data, field, colMeta = null) => {
  inlinePickerData.value = data
  inlinePickerField.value = field
  inlinePickerFieldMeta.value = colMeta
  inlinePickerValue.value = data[field]
  
  if (type === 'icon') {
    iconSearchQuery.value = ''
    inlineIconDialog.value = true
  } else if (type === 'tag_style') {
    inlineTagStyleDialog.value = true
  } else if (type === 'translatable') {
    // Initialize translations from data._translations
    inlineTranslations.value = {}
    const existingTranslations = data._translations?.[field] || {}
    
    for (const lang of availableLanguages.value) {
      // Use existing translation or empty string
      inlineTranslations.value[lang.code] = existingTranslations[lang.code] || ''
    }
    
    // If main value exists but no translation for current locale, use it
    if (data[field] && !existingTranslations[locale.value]) {
      inlineTranslations.value[locale.value] = data[field]
    }
    
    inlineTranslatableDialog.value = true
  }
}

const cancelInlinePicker = () => {
  inlineIconDialog.value = false
  inlineTagStyleDialog.value = false
  inlineTranslatableDialog.value = false
  inlinePickerData.value = null
  inlinePickerField.value = null
  inlinePickerFieldMeta.value = null
  inlinePickerValue.value = null
}

const confirmInlinePicker = async () => {
  if (!inlinePickerData.value || !inlinePickerField.value) return
  
  const data = inlinePickerData.value
  const field = inlinePickerField.value
  const newValue = inlinePickerValue.value
  const oldValue = data[field]
  
  // Skip if no change
  if (oldValue === newValue) {
    cancelInlinePicker()
    return
  }
  
  try {
    inlinePickerSaving.value = true
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.update(data.uuid, { [field]: newValue })
    
    // Update local data reactively by finding and updating the item in the array
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { ...items.value[itemIndex], [field]: newValue }
    }
    
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
    cancelInlinePicker()
  } catch (error) {
    console.error('Failed to update item:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update item', life: 3000 })
  } finally {
    inlinePickerSaving.value = false
  }
}

// Confirm translatable field update
const confirmInlineTranslatable = async () => {
  if (!inlinePickerData.value || !inlinePickerField.value) return
  
  const data = inlinePickerData.value
  const field = inlinePickerField.value
  
  // Build clean translations object (remove empty values)
  const cleanTranslations = {}
  for (const [code, value] of Object.entries(inlineTranslations.value)) {
    if (value && value.trim()) {
      cleanTranslations[code] = value.trim()
    }
  }
  
  // Determine the main value (current locale or first available)
  const newMainValue = cleanTranslations[locale.value] 
    || Object.values(cleanTranslations)[0] 
    || ''
  
  try {
    inlinePickerSaving.value = true
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    
    // Send update with both main value and translations
    await service.value.update(data.uuid, { 
      [field]: newMainValue,
      _translations: {
        ...data._translations,
        [field]: cleanTranslations
      }
    })
    
    // Update local data reactively
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { 
        ...items.value[itemIndex], 
        [field]: newMainValue,
        _translations: {
          ...items.value[itemIndex]._translations,
          [field]: cleanTranslations
        }
      }
    }
    
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
    cancelInlinePicker()
  } catch (error) {
    console.error('Failed to update translations:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update translations', life: 3000 })
  } finally {
    inlinePickerSaving.value = false
  }
}

const loadItems = async (pageNum = null) => {
  if (!service.value) {
    console.warn(`[ObjectsCrud] No service available for objectType: ${props.objectType}`)
    return
  }
  
  try {
    loading.value = true
    const page = typeof pageNum === 'number' ? pageNum : currentPage.value
    const result = await service.value.search({
      filters: filters.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      page,
      limit: pageSize
    })
    items.value = result.data || []
    totalRecords.value = result.total || 0
    if (typeof pageNum === 'number') currentPage.value = pageNum
  } catch (error) {
    console.error('Failed to load items:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load items', life: 3000 })
  } finally {
    loading.value = false
  }
}

const onPage = (event) => {
  loadItems(event.page + 1)
}

const onSort = () => {
  currentPage.value = 1
  loadItems(1)
}

const clearFilters = () => {
  filters.value = initFilters()
}

// ============================================
// Extended fields support for configuration_items
// ============================================

// Check if current object type is configuration_items
const isConfigurationItems = computed(() => props.objectType === 'configuration_items')

// Load CI types for the select dropdown
const loadCiTypes = async () => {
  if (ciTypesLoaded.value || !isConfigurationItems.value) return
  try {
    const data = await ciTypesService.getAll()
    ciTypes.value = data.map(ct => ({
      value: ct.code,
      label: ct._translations?.label?.[locale.value] || ct.label,
      uuid: ct.uuid,
      icon: ct.icon,
      color: ct.color
    }))
    ciTypesLoaded.value = true
  } catch (error) {
    console.error('Failed to load CI types:', error)
  }
}

// Get CI type UUID from code
const getCiTypeUuid = (code) => {
  const ciType = ciTypes.value.find(ct => ct.value === code)
  return ciType?.uuid
}

// Load extended fields for a CI type
const loadExtendedFields = async (ciTypeCode) => {
  if (!ciTypeCode || !isConfigurationItems.value) {
    extendedFields.value = []
    return
  }
  
  const ciTypeUuid = getCiTypeUuid(ciTypeCode)
  if (!ciTypeUuid) {
    extendedFields.value = []
    return
  }
  
  try {
    extendedFieldsLoading.value = true
    const fields = await ciTypeFieldsService.getByTypeUuid(ciTypeUuid)
    // Filter only fields that should show in form
    extendedFields.value = fields.filter(f => f.show_in_form).map(f => ({
      ...f,
      // Use translated label if available
      label: f._translations?.label?.[locale.value] || f.label
    }))
  } catch (error) {
    console.error('Failed to load extended fields:', error)
    extendedFields.value = []
  } finally {
    extendedFieldsLoading.value = false
  }
}

// Handle CI type change with confirmation
const handleCiTypeChange = (newValue) => {
  // If editing and type is changing, show confirmation
  if (dialogMode.value === 'edit' && editItem.value.ci_type && editItem.value.ci_type !== newValue) {
    pendingCiType.value = newValue
    changeTypeDialog.value = true
  } else {
    editItem.value.ci_type = newValue
    loadExtendedFields(newValue)
  }
}

// Confirm CI type change
const confirmCiTypeChange = () => {
  editItem.value.ci_type = pendingCiType.value
  // Clear extended fields values when type changes
  editItem.value.extended_core_fields = {}
  loadExtendedFields(pendingCiType.value)
  changeTypeDialog.value = false
  pendingCiType.value = null
}

// Cancel CI type change
const cancelCiTypeChange = () => {
  changeTypeDialog.value = false
  pendingCiType.value = null
}

// Get extended field value from extended_core_fields
const getExtendedFieldValue = (fieldName) => {
  return editItem.value.extended_core_fields?.[fieldName] ?? null
}

// Set extended field value in extended_core_fields
const setExtendedFieldValue = (fieldName, value) => {
  if (!editItem.value.extended_core_fields) {
    editItem.value.extended_core_fields = {}
  }
  editItem.value.extended_core_fields[fieldName] = value
}

// Get options for extended field
const getExtendedFieldOptions = (field) => {
  if (field.options) return field.options
  if (field.options_source) {
    try {
      return JSON.parse(field.options_source)
    } catch {
      return []
    }
  }
  return []
}

// ============================================

const openCreateDialog = async () => {
  // Load CI types if needed
  if (isConfigurationItems.value) {
    await loadCiTypes()
  }
  
  // Initialize with default values from form fields
  const defaults = {}
  for (const field of formFields.value) {
    if (field.field_type === 'boolean') {
      defaults[field.field_name] = false
    } else if (field.field_type === 'select' && field.options_source) {
      const options = getFieldOptions(field)
      defaults[field.field_name] = options.length > 0 ? options[0].value : null
    } else {
      defaults[field.field_name] = null
    }
  }
  
  // Initialize extended_core_fields for configuration_items
  if (isConfigurationItems.value) {
    defaults.extended_core_fields = {}
    defaults.ci_type = 'GENERIC' // Default type
  }
  
  editItem.value = defaults
  extendedFields.value = [] // Clear extended fields until type is selected
  dialogMode.value = 'create'
  itemDialog.value = true
  
  // Load extended fields for default type
  if (isConfigurationItems.value && defaults.ci_type) {
    await loadExtendedFields(defaults.ci_type)
  }
}

const openEditDialog = async (data) => {
  // Load CI types if needed
  if (isConfigurationItems.value) {
    await loadCiTypes()
  }
  
  editItem.value = { ...data }
  
  // Ensure extended_core_fields exists
  if (isConfigurationItems.value && !editItem.value.extended_core_fields) {
    editItem.value.extended_core_fields = {}
  }
  
  dialogMode.value = 'edit'
  itemDialog.value = true
  
  // Load extended fields for current type
  if (isConfigurationItems.value && editItem.value.ci_type) {
    await loadExtendedFields(editItem.value.ci_type)
  }
}

// Open edit in child tab (for toolbar Edit button)
const openEditInTab = (data) => {
  if (!data) return
  
  // Get the first required field as display name
  const nameField = formFields.value.find(f => f.is_required) || formFields.value[0]
  const displayName = data[nameField?.field_name] || data.uuid?.substring(0, 8)
  
  // Find the parent tab id_tab
  const parentTab = tabsStore.tabs.find(t => t.id === `${props.objectType}s` || t.objectType === props.objectType)
  
  tabsStore.openTab({
    id: `${props.objectType}-edit-${data.uuid}`,
    label: `${displayName}`,
    icon: objectTypeMetadata.value?.icon || 'pi pi-file',
    component: 'ObjectDetail',
    objectType: props.objectType,
    objectId: data.uuid,
    parentId: parentTab?.id_tab || props.tabId,
    mode: 'edit'
  })
}

// Open edit for multiple selected items
const openEditMultiple = () => {
  if (!selectedItems.value || selectedItems.value.length === 0) return
  
  // Open a tab for each selected item
  for (const item of selectedItems.value) {
    openEditInTab(item)
  }
}

const saveItem = async () => {
  // Validate required fields
  const requiredFields = formFields.value.filter(f => f.is_required)
  for (const field of requiredFields) {
    const value = editItem.value[field.field_name]
    if (value === null || value === undefined || value === '') {
      toast.add({ severity: 'warn', summary: 'Warning', detail: `${t(field.label_key)} is required`, life: 3000 })
      return
    }
  }

  try {
    saving.value = true
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    if (dialogMode.value === 'create') {
      await service.value.create(editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.created`), life: 3000 })
    } else {
      await service.value.update(editItem.value.uuid, editItem.value)
      toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
    }
    itemDialog.value = false
    await loadItems()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to save item', life: 3000 })
  } finally {
    saving.value = false
  }
}

const confirmDeleteSelected = () => {
  deleteDialog.value = true
}

const deleteSelectedItems = async () => {
  try {
    deleting.value = true
    const uuids = selectedItems.value.map(item => item.uuid)
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.deleteMany(uuids)
    toast.add({ 
      severity: 'success', 
      summary: 'Success', 
      detail: t(`${labelKey}.messages.deletedMultiple`, { count: uuids.length }), 
      life: 3000 
    })
    deleteDialog.value = false
    selectedItems.value = []
    await loadItems()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete items', life: 3000 })
  } finally {
    deleting.value = false
  }
}

const onCellEditComplete = async (event) => {
  const { data, newValue, field } = event
  if (data[field] === newValue) return

  try {
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.update(data.uuid, { [field]: newValue })
    data[field] = newValue
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
  } catch (error) {
    event.preventDefault()
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update item', life: 3000 })
  }
}

const onRowContextMenu = (event) => {
  cm.value.show(event.originalEvent)
}

const exportCSV = () => {
  dt.value.exportCSV()
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

// Format cell value based on field type
const formatCellValue = (value, field) => {
  if (value === null || value === undefined) return '-'
  
  switch (field.field_type) {
    case 'datetime':
    case 'date':
      return formatDate(value)
    case 'boolean':
      return value ? t('common.yes') : t('common.no')
    case 'select':
      const options = getFieldOptions(field)
      const option = options.find(o => o.value === value)
      return option?.label || value
    default:
      return value
  }
}

const onColumnReorder = (event) => {
  console.log('[ObjectsCrud] Column reorder event:', event)
}

const onStateRestore = (event) => {
  console.log('[ObjectsCrud] State restored:', event)
}

// Get option by value for a field
const getOptionByValue = (field, value) => {
  const options = getFieldOptions(field)
  return options.find(o => o.value === value)
}

// Get translated value for a translatable field
const getTranslatedValue = (data, fieldName) => {
  if (!data) return '-'
  
  // Check if translations exist for this field
  const translations = data._translations?.[fieldName]
  if (translations) {
    // Try current locale first, then fallback to default value
    const translatedValue = translations[locale.value]
    if (translatedValue) return translatedValue
  }
  
  // Fallback to the direct field value
  return data[fieldName] ?? '-'
}

// Note: getTagStyle and getColorValue are now imported from @/utils/tagStyles

// Load metadata for this object type
const loadMetadata = async () => {
  try {
    metadataLoading.value = true
    
    // Load object type with all fields
    objectTypeMetadata.value = await metadataService.getObjectType(props.objectType)
    
    if (objectTypeMetadata.value) {
      // Separate table columns and form fields
      tableColumns.value = objectTypeMetadata.value.fields.filter(f => f.show_in_table)
      formFields.value = objectTypeMetadata.value.fields.filter(f => f.show_in_form)
      
      // Load options for all select fields (including API endpoints)
      const allFields = objectTypeMetadata.value.fields
      await loadAllFieldOptions(allFields)
      
      // Set default sort from metadata
      sortField.value = objectTypeMetadata.value.default_sort_field || 'updated_at'
      sortOrder.value = objectTypeMetadata.value.default_sort_order || -1
      
      // Initialize filters based on columns
      filters.value = initFilters()
      
      // Initialize selected columns (visible by default)
      selectedColumns.value = tableColumns.value
        .filter(col => col.default_visible)
        .map(col => ({ field: col.field_name, header: t(col.label_key) }))
    }
  } catch (error) {
    console.error('Failed to load metadata:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load metadata', life: 3000 })
  } finally {
    metadataLoading.value = false
  }
}

// Watch filters with debounce
let searchTimeout = null
watch(filters, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadItems(1)
  }, 300)
}, { deep: true })

// Lifecycle
onMounted(async () => {
  // Load active languages for translatable fields
  loadActiveLanguages()
  
  await loadMetadata()
  if (serviceAvailable.value) {
    await loadItems(1)
  }
})
</script>

<style scoped>
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

:deep(.p-toolbar) {
  border: none;
  background: transparent;
  padding: 0;
}

/* Inline picker button styles */
.icon-item:focus,
.style-item:focus {
  outline: 2px solid var(--p-primary-500);
  outline-offset: 2px;
}
</style>
