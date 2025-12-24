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
      <Toolbar class="mb-4" :pt="{ root: { class: 'p-2' } }">
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
        class="flex-1 min-h-0"
        :pt="{
          root: { class: 'flex flex-col min-h-0' },
          tableContainer: { class: 'flex-1 min-h-0 overflow-auto' }
        }"
        :value="items"
        :size="tableSize"
        dataKey="uuid"
        :paginator="true"
        :rows="pageSize"
        :totalRecords="totalRecords"
        :lazy="true"
        :loading="loading"
        filterDisplay="menu"
        scrollable
        scrollHeight="flex"
        :globalFilterFields="globalFilterFields"
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

        <!-- Row actions menu column (only for persons) -->
        <Column 
          v-if="isPersons"
          field="_rowActions"
          style="min-width: 3rem; width: 3rem" 
          :exportable="false" 
          :reorderableColumn="false"
          frozen
        >
          <template #body="{ data }">
            <Button 
              icon="pi pi-ellipsis-v" 
              @click="toggleRowActionsMenu($event, data)" 
              severity="secondary" 
              text
              rounded 
              size="small" 
            />
          </template>
        </Column>

        <!-- Dynamic columns from metadata -->
        <template v-for="col in filteredTableColumns" :key="col.field_name">
        <Column 
          v-if="isColumnVisible(col.field_name)"
          :columnKey="col.field_name"
          :field="col.is_extended ? undefined : col.field_name" 
          :header="col.is_extended ? col.label : $t(col.label_key)" 
          :sortable="col.is_sortable"
          :dataType="col.data_type === 'date' ? 'date' : undefined"
          :style="`min-width: ${col.min_width || '10rem'}`"
        >
          <!-- Body template based on field type -->
          <template #body="{ data }">
            <div :class="{ 'opacity-50 cursor-not-allowed': !col.is_editable }">
            <!-- Ticket type display (uses translated label from relation) - MUST be before select -->
            <template v-if="col.field_name === 'ticket_type_code'">
              <span v-if="data.ticket_type?.label">{{ data.ticket_type.label }}</span>
              <span v-else>{{ data.ticket_type_code || '-' }}</span>
            </template>
            <!-- Boolean -->
            <template v-else-if="col.field_type === 'boolean'">
              <i :class="getFieldValue(data, col) ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
            </template>
            <!-- Select with Tag and color -->
            <template v-else-if="col.field_type === 'select'">
              <template v-if="col.is_extended">
                <!-- Extended field select -->
                <Tag 
                  v-if="getFieldValue(data, col)"
                  :value="getExtendedSelectLabel(col, getFieldValue(data, col))"
                >
                  <template #default>
                    <span>{{ getExtendedSelectLabel(col, getFieldValue(data, col)) }}</span>
                  </template>
                </Tag>
                <span v-else>-</span>
              </template>
              <template v-else>
                <!-- Regular field select -->
                <Tag 
                  v-if="getFieldValue(data, col)"
                  :value="formatCellValue(getFieldValue(data, col), col)"
                  :style="getTagStyle(getOptionByValue(col, getFieldValue(data, col))?.color)"
                >
                  <template #default>
                    <div class="flex items-center gap-2">
                      <i 
                        v-if="getOptionByValue(col, getFieldValue(data, col))?.icon" 
                        :class="['pi', getOptionByValue(col, getFieldValue(data, col))?.icon]" 
                      />
                      <span>{{ formatCellValue(getFieldValue(data, col), col) }}</span>
                    </div>
                  </template>
                </Tag>
                <span v-else>-</span>
              </template>
            </template>
            <!-- Date/Datetime -->
            <template v-else-if="col.field_type === 'datetime' || col.field_type === 'date'">
              {{ formatDate(getFieldValue(data, col), col.field_type === 'datetime') }}
            </template>
            <!-- Textarea (truncated) - with translation support, strip HTML for display -->
            <template v-else-if="col.field_type === 'textarea'">
              <span class="block max-w-xs truncate">
                {{ stripHtml(col.is_translatable ? getTranslatedValue(data, col.field_name) : getFieldValue(data, col)) }}
              </span>
            </template>
            <!-- Tag Style display -->
            <template v-else-if="col.field_type === 'tag_style'">
              <Tag 
                v-if="getFieldValue(data, col)"
                :style="getTagStyle(getFieldValue(data, col))"
              >
                {{ getFieldValue(data, col) }}
              </Tag>
              <span v-else>-</span>
            </template>
            <!-- Icon display -->
            <template v-else-if="col.field_type === 'icon_picker'">
              <div v-if="getFieldValue(data, col)" class="flex items-center gap-2">
                <i :class="`pi ${getFieldValue(data, col)}`" />
                <span class="text-sm text-surface-500">{{ getFieldValue(data, col) }}</span>
              </div>
              <span v-else>-</span>
            </template>
            <!-- CI Category display -->
            <template v-else-if="col.field_type === 'ci_category'">
              <div v-if="getFieldValue(data, col)" class="flex items-center gap-2">
                <i :class="`pi ${getCategoryIcon(getFieldValue(data, col))}`" />
                <span>{{ getCategoryLabel(getFieldValue(data, col)) }}</span>
              </div>
              <span v-else>-</span>
            </template>
            <!-- Workflow Status display/edit (inline editor with save/cancel buttons) -->
            <template v-else-if="col.field_type === 'workflow_status'">
              <InlineWorkflowStatusEditor
                v-if="col.is_editable !== false"
                :modelValue="data.rel_status_uuid"
                :statusObject="data.status"
                :entityType="objectType"
                :entityUuid="data.uuid"
                @save="(payload) => onWorkflowStatusSave(data, payload)"
              />
              <template v-else>
                <Tag 
                  v-if="data.status"
                  :value="getStatusLabel(data.status)"
                  :style="{ backgroundColor: data.status.category?.color || '#6b7280', color: 'white' }"
                />
                <span v-else class="text-surface-400 italic text-sm">{{ $t('workflow.noWorkflow') }}</span>
              </template>
            </template>
            <!-- Person display/edit (inline editor with save/cancel buttons) -->
            <template v-else-if="col.field_type === 'person'">
              <InlinePersonEditor
                v-if="col.is_editable"
                :modelValue="data[col.field_name]"
                :personObject="getPersonObject(data, col.field_name)"
                :placeholder="$t('persons.searchPlaceholder')"
                @save="(payload) => onPersonSave(data, col.field_name, payload)"
              />
              <span v-else-if="getPersonDisplay(data, col.field_name)">
                {{ getPersonDisplay(data, col.field_name) }}
              </span>
              <span v-else>-</span>
            </template>
            <!-- Group display/edit (inline editor with save/cancel buttons) -->
            <template v-else-if="col.field_type === 'group'">
              <InlineGroupEditor
                v-if="col.is_editable !== false"
                :modelValue="data[col.field_name]"
                :groupObject="getGroupObject(data, col.field_name)"
                :placeholder="$t('groups.searchPlaceholder')"
                @save="(payload) => onGroupSave(data, col.field_name, payload)"
              />
              <span v-else-if="getGroupDisplay(data, col.field_name)">
                {{ getGroupDisplay(data, col.field_name) }}
              </span>
              <span v-else>-</span>
            </template>
            <!-- Configuration Item display/edit (inline editor with save/cancel buttons) -->
            <template v-else-if="col.field_type === 'configuration_item'">
              <InlineConfigurationItemEditor
                v-if="col.is_editable !== false"
                :modelValue="data[col.field_name]"
                :configurationItemObject="getConfigurationItemObject(data, col.field_name)"
                :placeholder="$t('configurationItems.searchPlaceholder')"
                @save="(payload) => onConfigurationItemSave(data, col.field_name, payload)"
              />
              <span v-else-if="getConfigurationItemDisplay(data, col.field_name)">
                {{ getConfigurationItemDisplay(data, col.field_name) }}
              </span>
              <span v-else>-</span>
            </template>
            <!-- Default text - with translation support -->
            <template v-else>
              <template v-if="col.is_extended">
                {{ getExtendedCellValue(data, col) }}
              </template>
              <template v-else>
                {{ col.is_translatable ? getTranslatedValue(data, col.field_name) : (getFieldValue(data, col) ?? '-') }}
              </template>
            </template>
            </div>
          </template>
          
          <!-- Editor template (only for editable fields, except person, workflow_status, group and configuration_item fields which are handled in body) -->
          <template v-if="col.is_editable && col.field_type !== 'person' && col.field_type !== 'workflow_status' && col.field_type !== 'group' && col.field_type !== 'configuration_item'" #editor="{ data, field }">
            <!-- ========== EXTENDED FIELDS ========== -->
            <template v-if="col.is_extended">
              <!-- Select editor for extended fields -->
              <template v-if="col.field_type === 'select'">
                <InlinePickerButton :placeholder="$t('common.select')" @click="openInlinePicker('select', data, col.field_name, col, true)">
                  <template v-if="data.extended_core_fields?.[col.field_name]">
                    <span class="text-sm">{{ getExtendedSelectLabel(col, data.extended_core_fields?.[col.field_name]) }}</span>
                  </template>
                </InlinePickerButton>
              </template>
              <!-- Boolean editor for extended fields -->
              <template v-else-if="col.field_type === 'boolean'">
                <ToggleSwitch 
                  :modelValue="data.extended_core_fields?.[col.field_name]"
                  @update:modelValue="val => updateExtendedField(data, col.field_name, val)"
                />
              </template>
              <!-- Number editor for extended fields -->
              <template v-else-if="col.field_type === 'number'">
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('number', data, col.field_name, col, true)">
                  <span v-if="data.extended_core_fields?.[col.field_name] !== null && data.extended_core_fields?.[col.field_name] !== undefined" class="text-sm">
                    {{ data.extended_core_fields?.[col.field_name] }}{{ col.unit ? ` ${col.unit}` : '' }}
                  </span>
                </InlinePickerButton>
              </template>
              <!-- Date editor for extended fields -->
              <template v-else-if="col.field_type === 'date'">
                <InlinePickerButton :placeholder="$t('common.selectDate')" @click="openInlinePicker('date', data, col.field_name, col, true)">
                  <span v-if="data.extended_core_fields?.[col.field_name]" class="text-sm">{{ formatDate(data.extended_core_fields?.[col.field_name]) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Datetime editor for extended fields -->
              <template v-else-if="col.field_type === 'datetime'">
                <InlinePickerButton :placeholder="$t('common.selectDate')" @click="openInlinePicker('datetime', data, col.field_name, col, true)">
                  <span v-if="data.extended_core_fields?.[col.field_name]" class="text-sm">{{ formatDate(data.extended_core_fields?.[col.field_name], true) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Textarea editor for extended fields -->
              <template v-else-if="col.field_type === 'textarea'">
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('textarea', data, col.field_name, col, true)">
                  <span v-if="data.extended_core_fields?.[col.field_name]" class="text-sm truncate max-w-xs">
                    {{ stripHtml(data.extended_core_fields?.[col.field_name]) }}
                  </span>
                </InlinePickerButton>
              </template>
              <!-- Default text editor for extended fields -->
              <template v-else>
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('text', data, col.field_name, col, true)">
                  <span v-if="data.extended_core_fields?.[col.field_name]" class="text-sm">
                    {{ data.extended_core_fields?.[col.field_name] }}
                  </span>
                </InlinePickerButton>
              </template>
            </template>
            <!-- ========== REGULAR FIELDS ========== -->
            <template v-else>
              <!-- Select editor -->
              <template v-if="col.field_type === 'select'">
                <InlinePickerButton :placeholder="$t('common.select')" @click="openInlinePicker('select', data, field, col)">
                  <template v-if="data[field]">
                    <div 
                      class="flex items-center gap-2 px-2 py-1 rounded"
                      :style="getTagStyle(getOptionByValue(col, data[field])?.color)"
                    >
                      <i 
                        v-if="getOptionByValue(col, data[field])?.icon" 
                        :class="['pi', getOptionByValue(col, data[field])?.icon]" 
                      />
                      <span class="text-sm">{{ getOptionByValue(col, data[field])?.label }}</span>
                    </div>
                  </template>
                </InlinePickerButton>
              </template>
              <!-- Boolean editor -->
              <template v-else-if="col.field_type === 'boolean'">
                <ToggleSwitch v-model="data[field]" />
              </template>
              <!-- Number editor -->
              <template v-else-if="col.field_type === 'number'">
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('number', data, field, col)">
                  <span v-if="data[field] !== null && data[field] !== undefined" class="text-sm">{{ data[field] }}</span>
                </InlinePickerButton>
              </template>
              <!-- Date editor -->
              <template v-else-if="col.field_type === 'date'">
                <InlinePickerButton :placeholder="$t('common.selectDate')" @click="openInlinePicker('date', data, field, col)">
                  <span v-if="data[field]" class="text-sm">{{ formatDate(data[field]) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Datetime editor -->
              <template v-else-if="col.field_type === 'datetime'">
                <InlinePickerButton :placeholder="$t('common.selectDate')" @click="openInlinePicker('datetime', data, field, col)">
                  <span v-if="data[field]" class="text-sm">{{ formatDate(data[field], true) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Icon picker editor -->
              <template v-else-if="col.field_type === 'icon_picker'">
                <InlinePickerButton :placeholder="$t('common.selectIcon')" @click="openInlinePicker('icon', data, field)">
                  <template v-if="data[field]">
                    <i :class="`pi ${data[field]}`" />
                    <span class="text-sm">{{ data[field] }}</span>
                  </template>
                </InlinePickerButton>
              </template>
              <!-- Tag style editor -->
              <template v-else-if="col.field_type === 'tag_style'">
                <InlinePickerButton :placeholder="$t('common.selectTagStyle')" @click="openInlinePicker('tag_style', data, field)">
                  <Tag v-if="data[field]" :style="getTagStyle(data[field])" class="text-sm">
                    {{ data[field] }}
                  </Tag>
                </InlinePickerButton>
              </template>
              <!-- CI Category editor -->
              <template v-else-if="col.field_type === 'ci_category'">
                <InlinePickerButton :placeholder="$t('ciCategories.selectCategory')" @click="openInlinePicker('ci_category', data, field)">
                  <template v-if="data[field]">
                    <i :class="`pi ${getCategoryIcon(data[field])}`" />
                    <span class="text-sm">{{ getCategoryLabel(data[field]) }}</span>
                  </template>
                </InlinePickerButton>
              </template>
              <!-- Translatable field editor -->
              <template v-else-if="col.is_translatable">
                <InlinePickerButton @click="openInlinePicker('translatable', data, field, col)">
                  <span class="truncate text-left">{{ getTranslatedValue(data, field) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Textarea editor (non-translatable) -->
              <template v-else-if="col.field_type === 'textarea'">
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('textarea', data, field, col)">
                  <span v-if="data[field]" class="text-sm truncate max-w-xs">{{ stripHtml(data[field]) }}</span>
                </InlinePickerButton>
              </template>
              <!-- Person fields are handled in body template, not here -->
              <!-- Default text editor -->
              <template v-else>
                <InlinePickerButton :placeholder="$t('common.enterValue')" @click="openInlinePicker('text', data, field, col)">
                  <span v-if="data[field]" class="text-sm">{{ data[field] }}</span>
                </InlinePickerButton>
              </template>
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
            <!-- CI Category filter -->
            <template v-else-if="col.field_type === 'ci_category'">
              <Select 
                v-model="filterModel.value" 
                :options="ciCategories" 
                optionLabel="label" 
                optionValue="uuid" 
                showClear
                :placeholder="$t('ciCategories.selectCategory')"
              >
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i :class="`pi ${slotProps.option.icon || 'pi-folder'}`" />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </Select>
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

    <!-- Create/Edit Drawer with dynamic fields -->
    <Drawer 
      v-model:visible="itemDialog" 
      position="right"
      class="w-full md:w-[600px]"
      :showHeader="false"
    >
      <ObjectView
        :object-type="objectType"
        :object-id="editItemId"
        :mode="dialogMode"
        @saved="onDrawerSaved"
        @close="itemDialog = false"
      />
    </Drawer>
    

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

    <!-- Inline Pickers -->
    <IconPicker
      v-model="inlinePickerValue"
      :show="inlineIconDialog"
      :loading="inlinePickerSaving"
      @update:show="inlineIconDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <TagStylePicker
      v-model="inlinePickerValue"
      :show="inlineTagStyleDialog"
      :loading="inlinePickerSaving"
      @update:show="inlineTagStyleDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <CiCategoryPicker
      v-model="inlinePickerValue"
      :show="inlineCiCategoryDialog"
      :loading="inlinePickerSaving"
      :categories="ciCategories"
      :categories-loading="ciCategoriesLoading"
      @update:show="inlineCiCategoryDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <SelectPicker
      v-model="inlinePickerValue"
      :show="inlineSelectDialog"
      :loading="inlinePickerSaving"
      :options="inlineSelectOptions"
      :title="inlinePickerFieldMeta?.label_key ? $t(inlinePickerFieldMeta.label_key) : (inlinePickerFieldMeta?.label || $t('common.select'))"
      @update:show="inlineSelectDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <NumberPicker
      v-model="inlinePickerValue"
      :show="inlineNumberDialog"
      :loading="inlinePickerSaving"
      :title="inlinePickerFieldMeta?.label_key ? $t(inlinePickerFieldMeta.label_key) : (inlinePickerFieldMeta?.label || $t('common.enterValue'))"
      :unit="inlinePickerFieldMeta?.unit"
      @update:show="inlineNumberDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <DateTimePicker
      v-model="inlinePickerValue"
      :show="inlineDateDialog"
      :loading="inlinePickerSaving"
      :title="inlinePickerFieldMeta?.label_key ? $t(inlinePickerFieldMeta.label_key) : (inlinePickerFieldMeta?.label || $t('common.selectDate'))"
      :show-time="inlinePickerFieldMeta?.field_type === 'datetime'"
      @update:show="inlineDateDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <TextPicker
      v-model="inlinePickerValue"
      :show="inlineTextDialog"
      :loading="inlinePickerSaving"
      :title="inlinePickerFieldMeta?.label_key ? $t(inlinePickerFieldMeta.label_key) : (inlinePickerFieldMeta?.label || $t('common.enterValue'))"
      @update:show="inlineTextDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <TextareaPicker
      v-model="inlinePickerValue"
      :show="inlineTextareaDialog"
      :loading="inlinePickerSaving"
      :title="inlinePickerFieldMeta?.label_key ? $t(inlinePickerFieldMeta.label_key) : (inlinePickerFieldMeta?.label || $t('common.enterValue'))"
      @update:show="inlineTextareaDialog = $event"
      @confirm="confirmInlinePicker"
      @cancel="cancelInlinePicker"
    />

    <TranslatablePicker
      v-model="inlineTranslations"
      :show="inlineTranslatableDialog"
      :loading="inlinePickerSaving"
      :title="inlineTranslatableTitle"
      :languages="availableLanguages"
      :field-type="inlinePickerFieldMeta?.field_type"
      @update:show="inlineTranslatableDialog = $event"
      @confirm="confirmInlineTranslatable"
      @cancel="cancelInlinePicker"
    />

    <!-- Row Actions Menu (for persons) -->
    <Menu 
      v-if="isPersons"
      ref="rowActionsMenu" 
      :model="rowActionsMenuItems" 
      :popup="true" 
    />

    <!-- Reset Password Dialog -->
    <Dialog 
      v-model:visible="resetPasswordDialog" 
      :style="{ width: '400px' }" 
      :header="$t('persons.resetPassword.title')" 
      :modal="true"
    >
      <div class="flex flex-col gap-4">
        <p class="text-surface-600 dark:text-surface-400 text-sm">
          {{ $t('persons.resetPassword.description', { name: `${rowActionsTarget?.first_name || ''} ${rowActionsTarget?.last_name || ''}`.trim() || rowActionsTarget?.email }) }}
        </p>
        
        <div class="flex flex-col gap-2">
          <label for="resetNewPassword" class="font-semibold">{{ $t('persons.resetPassword.newPassword') }}</label>
          <Password 
            id="resetNewPassword"
            v-model="resetPasswordForm.newPassword" 
            toggleMask
            :feedback="true"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-2">
          <label for="resetConfirmPassword" class="font-semibold">{{ $t('persons.resetPassword.confirmPassword') }}</label>
          <Password 
            id="resetConfirmPassword"
            v-model="resetPasswordForm.confirmPassword" 
            toggleMask
            :feedback="false"
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" severity="secondary" text @click="resetPasswordDialog = false" />
        <Button :label="$t('common.save')" icon="pi pi-check" @click="handleResetPassword" :loading="resetPasswordSaving" />
      </template>
    </Dialog>
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
import ticketTypeFieldsService from '@/services/ticketTypeFieldsService'
import api from '@/services/api'
import { useTabsStore } from '@/stores/tabsStore'
import { useReferenceDataStore } from '@/stores/referenceDataStore'
import { useAuthStore } from '@/stores/authStore'

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
import ContextMenu from 'primevue/contextmenu'
import DatePicker from 'primevue/datepicker'
import Popover from 'primevue/popover'
import Checkbox from 'primevue/checkbox'
import ToggleSwitch from 'primevue/toggleswitch'
import MultiSelect from 'primevue/multiselect'
import Menu from 'primevue/menu'
import Password from 'primevue/password'
import Drawer from 'primevue/drawer'
import AutoComplete from 'primevue/autocomplete'

// Custom form components
import TagStyleSelector from '@/components/form/TagStyleSelector.vue'
import IconSelector from '@/components/form/IconSelector.vue'
import TranslatableInput from '@/components/form/TranslatableInput.vue'
import ObjectView from '@/components/object/ObjectView.vue'
import InlinePickerButton from '@/components/form/InlinePickerButton.vue'
import InlinePersonEditor from '@/components/form/InlinePersonEditor.vue'
import InlineWorkflowStatusEditor from '@/components/form/InlineWorkflowStatusEditor.vue'
import InlineGroupEditor from '@/components/form/InlineGroupEditor.vue'
import InlineConfigurationItemEditor from '@/components/form/InlineConfigurationItemEditor.vue'

// Pickers
import {
  IconPicker,
  TagStylePicker,
  SelectPicker,
  CiCategoryPicker,
  NumberPicker,
  DateTimePicker,
  TextPicker,
  TextareaPicker,
  TranslatablePicker
} from '@/components/pickers'

// Utils
import { getTagStyle, getColorValue } from '@/utils/tagStyles'
import languagesService from '@/services/languagesService'
import { useResponsiveSize } from '@/composables'

// Props
const props = defineProps({
  objectType: {
    type: String,
    required: true
  },
  tabId: {
    type: String,
    default: null
  },
  ciTypeUuid: {
    type: String,
    default: null
  },
  ticketTypeCode: {
    type: String,
    default: null
  },
  objectSetupType: {
    type: String,
    default: null
  }
})

console.log('[ObjectsCrud] Component mounted with props:', { objectType: props.objectType, tabId: props.tabId, ciTypeUuid: props.ciTypeUuid, ticketTypeCode: props.ticketTypeCode, objectSetupType: props.objectSetupType })

// Stores
const tabsStore = useTabsStore()
const referenceDataStore = useReferenceDataStore()
const authStore = useAuthStore()

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
const { tableSize, isMobile } = useResponsiveSize()

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
const editItemId = ref(null) // UUID of item being edited (null for create)

// Extended fields for configuration_items
const extendedFields = ref([])
const extendedFieldsLoading = ref(false)

// CI Type fields (dynamic columns for filtered CI views)
const ciTypeFields = ref([])
const ciTypeFieldsLoading = ref(false)

// Ticket Type fields (dynamic columns for filtered ticket views)
const ticketTypeFields = ref([])
const ticketTypeFieldsLoading = ref(false)

// Use store for reference data
const ciTypes = computed(() => referenceDataStore.ciTypes)
const ciCategories = computed(() => referenceDataStore.ciCategories)
const ciCategoriesLoading = computed(() => referenceDataStore.loading.ciCategories)
const pendingCiType = ref(null)

// Inline picker dialogs
const inlineIconDialog = ref(false)
const inlineTagStyleDialog = ref(false)
const inlineTranslatableDialog = ref(false)
const inlineCiCategoryDialog = ref(false)
const inlineSelectDialog = ref(false)
const inlineNumberDialog = ref(false)
const inlineDateDialog = ref(false)
const inlineTextDialog = ref(false)
const inlineTextareaDialog = ref(false)
const inlinePickerData = ref(null) // The row data being edited
const inlinePickerField = ref(null) // The field name being edited
const inlinePickerFieldMeta = ref(null) // The field metadata (for translatable/select/etc)
const inlinePickerValue = ref(null) // The temporary selected value
const inlinePickerSaving = ref(false)
const inlinePickerIsExtended = ref(false) // Flag to track if editing extended field

// Person cache
const personsCache = ref({}) // Cache person data by UUID

// Translatable field support
const inlineTranslations = ref({}) // Temporary translations { fr: '...', en: '...' }
const availableLanguages = ref([])

// Row actions menu (for persons)
const rowActionsMenu = ref()
const rowActionsTarget = ref(null)
const resetPasswordDialog = ref(false)
const resetPasswordForm = ref({
  newPassword: '',
  confirmPassword: ''
})
const resetPasswordSaving = ref(false)

// Load active languages from API
const loadActiveLanguages = async () => {
  availableLanguages.value = await languagesService.getActiveLanguagesWithFlags()
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
      const useOrOperator = col.field_type === 'select' || col.field_type === 'ci_category'
      baseFilters[col.field_name] = {
        operator: useOrOperator ? FilterOperator.OR : FilterOperator.AND,
        constraints: [{ value: null, matchMode }]
      }
    }
  }
  
  return baseFilters
}

const getDefaultMatchMode = (col) => {
  switch (col.field_type) {
    case 'select':
    case 'ci_category':
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

// Columns to hide when ciTypeUuid is set (filtered view for configuration_items)
const hiddenColumnsForCiType = []

// Columns to hide when ticketTypeCode is set (filtered view for tickets)
// Note: ticket_type_code is now always visible
const hiddenColumnsForTicketType = []

// Helper to map type fields to extended columns (DRY)
const mapTypeFieldsToColumns = (fields) => {
  return fields
    .filter(f => f.show_in_table)
    .map(f => ({
      field_name: f.field_name,
      label_key: null, // No i18n key, use dynamic label
      label: f.label, // Dynamic label from type_fields
      field_type: f.field_type,
      data_type: f.data_type,
      is_sortable: false, // Extended fields are not sortable for now
      is_editable: !f.is_readonly, // Enable inline editing if not readonly
      default_visible: true,
      is_extended: true, // Flag to identify extended fields
      options_source: f.options_source,
      options: f.options, // Parsed options for select fields
      unit: f.unit
    }))
}

// Filtered table columns (excludes hidden columns when type filter is set, adds extended fields)
const filteredTableColumns = computed(() => {
  // Base columns from metadata
  let columns = tableColumns.value
  
  // Configuration Items: filter by ciTypeUuid
  if (props.ciTypeUuid) {
    // Filter out hidden columns (like ci_type)
    columns = columns.filter(col => !hiddenColumnsForCiType.includes(col.field_name))
    
    // Add extended columns from ci_type_fields (show_in_table = true)
    const extendedColumns = mapTypeFieldsToColumns(ciTypeFields.value)
    columns = [...columns, ...extendedColumns]
  }
  
  // Tickets: filter by ticketTypeCode
  if (props.ticketTypeCode) {
    // Filter out hidden columns (like ticket_type_code)
    columns = columns.filter(col => !hiddenColumnsForTicketType.includes(col.field_name))
    
    // Add extended columns from ticket_type_fields (show_in_table = true)
    const extendedColumns = mapTypeFieldsToColumns(ticketTypeFields.value)
    columns = [...columns, ...extendedColumns]
  }
  
  return columns
})

// Column toggle - built from metadata
const toggleableColumns = computed(() => {
  return filteredTableColumns.value.map(col => ({
    field: col.field_name,
    header: col.is_extended ? col.label : t(col.label_key)
  }))
})

const selectedColumns = ref([])

const isColumnVisible = (field) => {
  // Always hide certain columns when ciTypeUuid is set
  if (props.ciTypeUuid && hiddenColumnsForCiType.includes(field)) {
    return false
  }
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

const globalFilterFields = computed(() => {
  const columns = filteredTableColumns.value || []

  const fields = columns
    .filter(col => col?.is_filterable)
    .filter(col => ['text', 'textarea'].includes(col.field_type))
    .filter(col => !col.is_extended)
    .map(col => col.field_name)
    .filter(Boolean)

  if (fields.length > 0) return fields

  return ['name', 'description']
})

const paginationTemplate = computed(() => {
  const templates = {
    fr: 'Affichage de {first} à {last} sur {totalRecords} éléments',
    en: 'Showing {first} to {last} of {totalRecords} items'
  }
  return templates[locale.value] || templates.en
})


// Title for translatable dialog
const inlineTranslatableTitle = computed(() => {
  if (inlinePickerFieldMeta.value?.label_key) {
    return `${t('common.translate')} - ${t(inlinePickerFieldMeta.value.label_key)}`
  }
  return t('common.translate')
})

// Options for inline select picker
const inlineSelectOptions = computed(() => {
  if (!inlinePickerFieldMeta.value) return []
  
  // For extended fields, options are directly in col.options
  if (inlinePickerIsExtended.value) {
    return inlinePickerFieldMeta.value.options || []
  }
  
  // For regular fields, get from fieldOptions cache
  return getFieldOptions(inlinePickerFieldMeta.value)
})

// Methods

// Inline picker methods - use store for loading
const loadCiCategories = () => referenceDataStore.loadCiCategories()

const getCategoryLabel = (uuid) => {
  const category = ciCategories.value.find(c => c.uuid === uuid)
  return category?.label || '-'
}

const getCategoryIcon = (uuid) => {
  const category = ciCategories.value.find(c => c.uuid === uuid)
  return category?.icon || 'pi-folder'
}

// Person display and autocomplete functions
const getPersonDisplay = (data, fieldName) => {
  // Check if we have the person data in the row (populated by backend)
  const personField = fieldName.replace('_uuid', '')
  if (data[personField] && typeof data[personField] === 'object') {
    return `${data[personField].first_name} ${data[personField].last_name}`
  }
  // Check cache
  const uuid = data[fieldName]
  if (uuid && personsCache.value[uuid]) {
    return personsCache.value[uuid].fullName
  }
  return null
}

const getPersonObject = (data, fieldName) => {
  const personField = fieldName.replace('_uuid', '')
  if (data[personField] && typeof data[personField] === 'object') {
    return {
      uuid: data[personField].uuid,
      first_name: data[personField].first_name,
      last_name: data[personField].last_name,
      email: data[personField].email,
      fullName: `${data[personField].first_name} ${data[personField].last_name}`
    }
  }
  const uuid = data[fieldName]
  if (uuid && personsCache.value[uuid]) {
    return personsCache.value[uuid]
  }
  return null
}

const onPersonSave = async (data, fieldName, payload) => {
  try {
    const { uuid: personUuid, person } = payload
    const updateData = { [fieldName]: personUuid }
    await service.value.update(data.uuid, updateData)
    
    // Update local data
    data[fieldName] = personUuid
    const personField = fieldName.replace('_uuid', '')
    data[personField] = person
    
    // Update the item in the items array to ensure reactivity
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { 
        ...items.value[itemIndex], 
        [fieldName]: personUuid,
        [personField]: person
      }
    }
    
    // Cache the person if selected
    if (person?.uuid) {
      personsCache.value[person.uuid] = person
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.saved'),
      life: 3000
    })
  } catch (error) {
    console.error('[ObjectsCrud] Error updating person field:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.saveFailed'),
      life: 5000
    })
  }
}

const onWorkflowStatusSave = async (data, payload) => {
  try {
    const { uuid: statusUuid, status } = payload
    const updateData = { rel_status_uuid: statusUuid }
    await service.value.update(data.uuid, updateData)
    
    // Update local data
    data.rel_status_uuid = statusUuid
    data.status = status
    
    // Update the item in the items array to ensure reactivity
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { 
        ...items.value[itemIndex], 
        rel_status_uuid: statusUuid,
        status: status
      }
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.saved'),
      life: 3000
    })
  } catch (error) {
    console.error('[ObjectsCrud] Error updating workflow status:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.saveFailed'),
      life: 5000
    })
  }
}

// Group display and editor functions
// Convention: field_name = 'assigned_group_uuid', relation = 'assigned_group'
const getGroupDisplay = (data, fieldName) => {
  // Transform: assigned_group_uuid -> assigned_group
  const relationField = fieldName.replace('_uuid', '')
  if (data[relationField] && typeof data[relationField] === 'object') {
    return data[relationField].group_name
  }
  return null
}

const getGroupObject = (data, fieldName) => {
  // Transform: assigned_group_uuid -> assigned_group
  const relationField = fieldName.replace('_uuid', '')
  if (data[relationField] && typeof data[relationField] === 'object') {
    return {
      uuid: data[relationField].uuid,
      group_name: data[relationField].group_name,
      description: data[relationField].description
    }
  }
  return null
}

const onGroupSave = async (data, fieldName, payload) => {
  try {
    const { uuid: groupUuid, group } = payload
    const updateData = { [fieldName]: groupUuid }
    await service.value.update(data.uuid, updateData)
    
    // Update local data - fieldName is like 'assigned_group_uuid', relation is 'assigned_group'
    data[fieldName] = groupUuid
    const relationField = fieldName.replace('_uuid', '')
    data[relationField] = group
    
    // Update the item in the items array to ensure reactivity
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { 
        ...items.value[itemIndex], 
        [fieldName]: groupUuid,
        [relationField]: group
      }
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.saved'),
      life: 3000
    })
  } catch (error) {
    console.error('[ObjectsCrud] Error updating group field:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.saveFailed'),
      life: 5000
    })
  }
}

// Configuration Item display and editor functions
const getConfigurationItemDisplay = (data, fieldName) => {
  // Check if we have the CI data in the row (populated by backend)
  // Field name is like 'configuration_item_uuid', CI object would be at 'configuration_item'
  const ciField = fieldName.replace('_uuid', '')
  if (data[ciField] && typeof data[ciField] === 'object') {
    return data[ciField].name
  }
  // Also check direct field name without transformation
  if (data[fieldName] && typeof data[fieldName] === 'object') {
    return data[fieldName].name
  }
  return null
}

const getConfigurationItemObject = (data, fieldName) => {
  // Field name is like 'configuration_item_uuid', CI object would be at 'configuration_item'
  const ciField = fieldName.replace('_uuid', '')
  if (data[ciField] && typeof data[ciField] === 'object') {
    return {
      uuid: data[ciField].uuid,
      name: data[ciField].name,
      ci_type: data[ciField].ci_type
    }
  }
  // Also check direct field name without transformation
  if (data[fieldName] && typeof data[fieldName] === 'object') {
    return {
      uuid: data[fieldName].uuid,
      name: data[fieldName].name,
      ci_type: data[fieldName].ci_type
    }
  }
  return null
}

const onConfigurationItemSave = async (data, fieldName, payload) => {
  try {
    const { uuid: ciUuid, configurationItem } = payload
    const updateData = { [fieldName]: ciUuid }
    await service.value.update(data.uuid, updateData)
    
    // Update local data
    data[fieldName] = ciUuid
    const ciField = fieldName.replace('_uuid', '')
    data[ciField] = configurationItem
    
    // Update the item in the items array to ensure reactivity
    const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
    if (itemIndex !== -1) {
      items.value[itemIndex] = { 
        ...items.value[itemIndex], 
        [fieldName]: ciUuid,
        [ciField]: configurationItem
      }
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('common.saved'),
      life: 3000
    })
  } catch (error) {
    console.error('[ObjectsCrud] Error updating configuration item field:', error)
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('common.saveFailed'),
      life: 5000
    })
  }
}

const openInlinePicker = (type, data, field, colMeta = null, isExtended = false) => {
  inlinePickerData.value = data
  inlinePickerField.value = field
  inlinePickerFieldMeta.value = colMeta
  inlinePickerIsExtended.value = isExtended
  
  // Get current value based on whether it's an extended field or not
  if (isExtended) {
    inlinePickerValue.value = data.extended_core_fields?.[field] ?? null
  } else {
    inlinePickerValue.value = data[field]
  }
  
  if (type === 'icon') {
    inlineIconDialog.value = true
  } else if (type === 'tag_style') {
    inlineTagStyleDialog.value = true
  } else if (type === 'ci_category') {
    loadCiCategories()
    inlineCiCategoryDialog.value = true
  } else if (type === 'select') {
    inlineSelectDialog.value = true
  } else if (type === 'number') {
    inlineNumberDialog.value = true
  } else if (type === 'date' || type === 'datetime') {
    // Convert ISO string to Date object for DatePicker
    if (inlinePickerValue.value && typeof inlinePickerValue.value === 'string') {
      inlinePickerValue.value = new Date(inlinePickerValue.value)
    }
    inlineDateDialog.value = true
  } else if (type === 'text') {
    inlineTextDialog.value = true
  } else if (type === 'textarea') {
    inlineTextareaDialog.value = true
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
  inlineCiCategoryDialog.value = false
  inlineSelectDialog.value = false
  inlineNumberDialog.value = false
  inlineDateDialog.value = false
  inlineTextDialog.value = false
  inlineTextareaDialog.value = false
  inlinePickerData.value = null
  inlinePickerField.value = null
  inlinePickerFieldMeta.value = null
  inlinePickerValue.value = null
  inlinePickerIsExtended.value = false
}

const confirmInlinePicker = async () => {
  if (!inlinePickerData.value || !inlinePickerField.value) return
  
  const data = inlinePickerData.value
  const field = inlinePickerField.value
  const newValue = inlinePickerValue.value
  const isExtended = inlinePickerIsExtended.value
  
  try {
    inlinePickerSaving.value = true
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    
    if (isExtended) {
      // Update extended field
      const updatedExtendedFields = {
        ...data.extended_core_fields,
        [field]: newValue
      }
      await service.value.update(data.uuid, { extended_core_fields: updatedExtendedFields })
      
      // Update local data reactively
      const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
      if (itemIndex !== -1) {
        items.value[itemIndex] = { 
          ...items.value[itemIndex], 
          extended_core_fields: updatedExtendedFields 
        }
      }
    } else {
      // Update regular field
      await service.value.update(data.uuid, { [field]: newValue })
      
      // Update local data reactively
      const itemIndex = items.value.findIndex(item => item.uuid === data.uuid)
      if (itemIndex !== -1) {
        items.value[itemIndex] = { ...items.value[itemIndex], [field]: newValue }
      }
    }
    
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
    
    // Invalidate store cache for reference data
    if (props.objectType === 'ci_categories') {
      referenceDataStore.invalidateCiCategories()
    } else if (props.objectType === 'ci_types') {
      referenceDataStore.invalidateCiTypes()
    }
    
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
    
    // Invalidate store cache for reference data
    if (props.objectType === 'ci_categories') {
      referenceDataStore.invalidateCiCategories()
    } else if (props.objectType === 'ci_types') {
      referenceDataStore.invalidateCiTypes()
    }
    
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
    
    const searchParams = {
      filters: filters.value,
      sortField: sortField.value,
      sortOrder: sortOrder.value,
      page,
      limit: pageSize
    }

    searchParams.globalSearchFields = globalFilterFields.value
    
    // Add ciTypeUuid filter if provided (for CI type-specific views)
    if (props.ciTypeUuid) {
      searchParams.ciTypeUuid = props.ciTypeUuid
    }
    
    // Add ticketTypeCode filter if provided (for ticket type-specific views)
    if (props.ticketTypeCode) {
      searchParams.ticketTypeCode = props.ticketTypeCode
    }
    
    // Add objectSetupType filter if provided (for object_setup filtered views like entity_setup)
    if (props.objectSetupType) {
      searchParams.objectSetupType = props.objectSetupType
    }
    
    const result = await service.value.search(searchParams)
    console.log('[ObjectsCrud] loadItems - raw result:', result)
    if (result.data?.length > 0) {
      console.log('[ObjectsCrud] loadItems - first item ticket_type:', result.data[0].ticket_type)
    }
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

// Check if current object type is tickets
const isTickets = computed(() => props.objectType === 'tickets')

// Check if current object type is persons (for row actions menu)
const isPersons = computed(() => props.objectType === 'persons')

// Row actions menu items for persons
const rowActionsMenuItems = computed(() => [
  {
    label: t('persons.actions.resetPassword'),
    icon: 'pi pi-key',
    command: () => openResetPasswordDialog()
  }
])

// Track original values for extended fields to detect changes
const extendedFieldOriginalValues = ref({})

// Set extended field value locally (without saving to backend)
const setExtendedFieldValue = (data, fieldName, value) => {
  // Ensure extended_core_fields exists
  if (!data.extended_core_fields) {
    data.extended_core_fields = {}
  }
  
  // Store original value on first edit (before any change)
  const key = `${data.uuid}-${fieldName}`
  if (!(key in extendedFieldOriginalValues.value)) {
    extendedFieldOriginalValues.value[key] = data.extended_core_fields[fieldName]
  }
  
  // Update the field value locally
  data.extended_core_fields[fieldName] = value
}

// Save extended field to backend (called on blur for text/number fields)
const saveExtendedField = async (data, fieldName) => {
  if (!data.extended_core_fields) return
  
  // Check if value actually changed
  const key = `${data.uuid}-${fieldName}`
  const originalValue = extendedFieldOriginalValues.value[key]
  const currentValue = data.extended_core_fields[fieldName]
  
  // Clear the tracked original value
  delete extendedFieldOriginalValues.value[key]
  
  // Don't save if value hasn't changed
  if (originalValue === currentValue) {
    console.log('[ObjectsCrud] saveExtendedField - No change detected, skipping save')
    return
  }
  
  try {
    await service.value.update(data.uuid, {
      extended_core_fields: data.extended_core_fields
    })
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('common.saved'), life: 2000 })
  } catch (error) {
    console.error('Failed to update extended field:', error)
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to update field', life: 3000 })
  }
}

// Update extended field value and save immediately (for select/boolean fields)
const updateExtendedField = async (data, fieldName, value) => {
  setExtendedFieldValue(data, fieldName, value)
  await saveExtendedField(data, fieldName)
}

// Toggle row actions menu
const toggleRowActionsMenu = (event, data) => {
  rowActionsTarget.value = data
  rowActionsMenu.value.toggle(event)
}

// Open reset password dialog
const openResetPasswordDialog = () => {
  resetPasswordForm.value = {
    newPassword: '',
    confirmPassword: ''
  }
  resetPasswordDialog.value = true
}

// Handle reset password
const handleResetPassword = async () => {
  // Validate passwords match
  if (resetPasswordForm.value.newPassword !== resetPasswordForm.value.confirmPassword) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: t('persons.resetPassword.passwordMismatch'),
      life: 3000
    })
    return
  }

  // Validate password is not empty
  if (!resetPasswordForm.value.newPassword) {
    toast.add({
      severity: 'warn',
      summary: t('common.error'),
      detail: t('persons.resetPassword.newPassword') + ' is required',
      life: 3000
    })
    return
  }

  try {
    resetPasswordSaving.value = true
    
    // Call API to reset password
    await service.value.resetPassword(rowActionsTarget.value.uuid, {
      newPassword: resetPasswordForm.value.newPassword
    })
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('persons.resetPassword.success'),
      life: 3000
    })
    
    resetPasswordDialog.value = false
    rowActionsTarget.value = null
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.message || t('persons.resetPassword.error'),
      life: 3000
    })
  } finally {
    resetPasswordSaving.value = false
  }
}

// Load CI types from store
const loadCiTypes = () => referenceDataStore.loadCiTypes()

// Get CI type UUID from code
const getCiTypeUuid = (code) => {
  const ciType = ciTypes.value.find(ct => ct.code === code)
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


// ============================================

const openCreateDialog = () => {
  editItemId.value = null
  dialogMode.value = 'create'
  itemDialog.value = true
}

const openEditDialog = (data) => {
  editItemId.value = data.uuid
  dialogMode.value = 'edit'
  itemDialog.value = true
}

const onDrawerSaved = async () => {
  itemDialog.value = false
  
  // Invalidate store cache for reference data
  if (props.objectType === 'ci_categories') {
    referenceDataStore.invalidateCiCategories()
  } else if (props.objectType === 'ci_types') {
    referenceDataStore.invalidateCiTypes()
  }
  
  await loadItems()
}

// Open edit in child tab (for toolbar Edit button)
const openEditInTab = (data) => {
  if (!data) return
  
  // Get the first required field as display name
  const nameField = formFields.value.find(f => f.is_required) || formFields.value[0]
  const displayName = data[nameField?.field_name] || data.uuid?.substring(0, 8)
  
  // Use props.tabId directly - it's the id_tab of the current parent tab
  // This ensures CI items open in the correct parent tab (e.g., application CI opens in application tab)
  const parentTabId = props.tabId
  
  console.log('[ObjectsCrud] openEditInTab - data:', data.uuid, 'parentTabId:', parentTabId, 'objectType:', props.objectType, 'ciTypeUuid:', props.ciTypeUuid)
  
  if (!parentTabId) {
    console.error('[ObjectsCrud] openEditInTab - No parent tab ID available!')
    return
  }
  
  tabsStore.openTab({
    id: `${props.objectType}-edit-${data.uuid}`,
    label: `${displayName}`,
    icon: objectTypeMetadata.value?.icon || 'pi pi-file',
    component: 'ObjectView',
    objectType: props.objectType,
    objectId: data.uuid,
    parentId: parentTabId,
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
    
    // Invalidate store cache for reference data
    if (props.objectType === 'ci_categories') {
      referenceDataStore.invalidateCiCategories()
    } else if (props.objectType === 'ci_types') {
      referenceDataStore.invalidateCiTypes()
    }
    
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
  console.log('[ObjectsCrud] onCellEditComplete called:', { field, newValue, oldValue: data[field], dataUuid: data?.uuid })
  if (data[field] === newValue) {
    console.log('[ObjectsCrud] onCellEditComplete: No change detected, returning early')
    return
  }

  try {
    const labelKey = objectTypeMetadata.value?.label_key?.split('.')[0] || 'common'
    await service.value.update(data.uuid, { [field]: newValue })
    data[field] = newValue
    toast.add({ severity: 'success', summary: 'Success', detail: t(`${labelKey}.messages.updated`), life: 3000 })
    
    // Invalidate store cache for reference data
    if (props.objectType === 'ci_categories') {
      referenceDataStore.invalidateCiCategories()
    } else if (props.objectType === 'ci_types') {
      referenceDataStore.invalidateCiTypes()
    }
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

const formatDate = (dateString, showTime = false) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (showTime) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  return date.toLocaleDateString()
}

// Strip HTML tags and return plain text (for displaying rich text in table cells)
const stripHtml = (html) => {
  if (!html) return '-'
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  return tmp.textContent || tmp.innerText || '-'
}

// Format cell value based on field type
const formatCellValue = (value, field) => {
  if (value === null || value === undefined) return '-'
  
  switch (field.field_type) {
    case 'datetime':
      return formatDate(value, true)
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

// Get label for extended field select value
const getExtendedSelectLabel = (col, value) => {
  if (!value) return '-'
  // col.options contains the parsed options array from ci_type_fields
  const options = col.options || []
  const option = options.find(o => o.value === value)
  return option?.label || value
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

// Helper to get field value (handles both regular and extended fields)
const getFieldValue = (data, col) => {
  if (!data) return null
  if (col.is_extended) {
    return data.extended_core_fields?.[col.field_name] ?? null
  }
  return data[col.field_name] ?? null
}

// Helper to get status label with translation
const getStatusLabel = (status) => {
  if (!status) return ''
  // Use translated name if available for current locale
  if (status._translations?.name?.[locale.value]) {
    return status._translations.name[locale.value]
  }
  return status.name || ''
}

// Get value from extended_core_fields for table display
const getExtendedCellValue = (data, col) => {
  if (!data || !data.extended_core_fields) return '-'
  
  const value = data.extended_core_fields[col.field_name]
  if (value === null || value === undefined || value === '') return '-'
  
  // Format based on field type
  switch (col.field_type) {
    case 'number':
      // Add unit if defined
      return col.unit ? `${value} ${col.unit}` : value
    case 'boolean':
      return value ? t('common.yes') : t('common.no')
    case 'date':
      return formatDate(value)
    case 'datetime':
      return formatDate(value, true)
    default:
      return value
  }
}

// Load CI type fields for extended columns
const loadCiTypeFields = async () => {
  if (!props.ciTypeUuid) {
    ciTypeFields.value = []
    return
  }
  
  try {
    ciTypeFieldsLoading.value = true
    const fields = await ciTypeFieldsService.getByTypeUuid(props.ciTypeUuid)
    ciTypeFields.value = fields || []
    console.log(`[ObjectsCrud] Loaded ${ciTypeFields.value.length} CI type fields for type ${props.ciTypeUuid}`)
  } catch (error) {
    console.error('Failed to load CI type fields:', error)
    ciTypeFields.value = []
  } finally {
    ciTypeFieldsLoading.value = false
  }
}

// Load ticket type fields for extended columns
const loadTicketTypeFields = async () => {
  if (!props.ticketTypeCode) {
    ticketTypeFields.value = []
    return
  }
  
  try {
    ticketTypeFieldsLoading.value = true
    // First get the ticket type UUID from the code
    const ticketTypesResponse = await api.get('/ticket-types')
    const ticketType = ticketTypesResponse.data?.find(t => t.code === props.ticketTypeCode)
    
    if (!ticketType) {
      console.warn(`[ObjectsCrud] Ticket type not found for code: ${props.ticketTypeCode}`)
      ticketTypeFields.value = []
      return
    }
    
    const fields = await ticketTypeFieldsService.getByTypeUuid(ticketType.uuid)
    ticketTypeFields.value = fields || []
    console.log(`[ObjectsCrud] Loaded ${ticketTypeFields.value.length} ticket type fields for type ${props.ticketTypeCode}`)
  } catch (error) {
    console.error('Failed to load ticket type fields:', error)
    ticketTypeFields.value = []
  } finally {
    ticketTypeFieldsLoading.value = false
  }
}

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
      
      // Load CI type fields if ciTypeUuid is set (for extended columns)
      if (props.ciTypeUuid && isConfigurationItems.value) {
        await loadCiTypeFields()
      }
      
      // Load ticket type fields if ticketTypeCode is set (for extended columns)
      if (props.ticketTypeCode && isTickets.value) {
        await loadTicketTypeFields()
      }
      
      // Initialize selected columns (visible by default, including extended fields)
      const baseColumns = tableColumns.value
        .filter(col => col.default_visible)
        .map(col => ({ field: col.field_name, header: t(col.label_key) }))
      
      // Extended columns from CI type fields
      const ciExtendedCols = ciTypeFields.value
        .filter(f => f.show_in_table)
        .map(f => ({ field: f.field_name, header: f.label }))
      
      // Extended columns from ticket type fields
      const ticketExtendedCols = ticketTypeFields.value
        .filter(f => f.show_in_table)
        .map(f => ({ field: f.field_name, header: f.label }))
      
      selectedColumns.value = [...baseColumns, ...ciExtendedCols, ...ticketExtendedCols]
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
  
  // Load CI categories if needed for ci_types object type
  if (props.objectType === 'ci_types') {
    await loadCiCategories()
  }
  
  await loadMetadata()
})
</script>

