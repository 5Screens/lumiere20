<template>
  <div class="app-tabs h-full flex flex-col">
    <!-- Empty state when no tabs -->
    <div 
      v-if="tabsStore.parentTabs.length === 0"
      class="h-full flex items-center justify-center text-surface-400"
    >
      <div class="text-center">
        <i class="pi pi-inbox text-4xl mb-4 block" />
        <p>{{ $t('tabs.noTabsOpen') }}</p>
      </div>
    </div>

    <!-- Primary TabView (parent level) -->
    <TabView 
      v-else
      :activeIndex="activeParentIndex"
      @update:activeIndex="onParentTabChange"
      scrollable
      class="flex-1 flex flex-col min-h-0 parent-tabs"
      :pt="{
        root: { class: 'flex-1 flex flex-col min-h-0' },
        panelContainer: { class: 'flex-1 min-h-0 overflow-hidden' },
        nav: { class: 'parent-nav' }
      }"
    >
      <TabPanel 
        v-for="tab in tabsStore.parentTabs" 
        :key="tab.id_tab"
        :pt="{
          root: { class: 'h-full flex flex-col' },
          content: { class: 'flex-1 min-h-0 overflow-hidden p-0' }
        }"
      >
        <template #header>
          <div class="flex items-center gap-2">
            <i v-if="tab.icon" :class="tab.icon" class="text-sm" />
            <span>{{ getTabLabel(tab) }}</span>
            <button 
              class="close-btn ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-200 dark:hover:bg-surface-600 transition-all duration-200"
              @click.stop="closeParentTab(tab.id_tab)"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
        </template>

        <!-- Content with child tabs support -->
        <div class="h-full flex flex-col">
          <!-- Secondary TabView (child level) - only for components that support it -->
          <TabView 
            v-if="hasChildTabs(tab)"
            :activeIndex="getChildTabIndex(tab.id_tab)"
            @update:activeIndex="(index) => onChildTabChange(tab.id_tab, index)"
            scrollable
            class="flex-1 flex flex-col min-h-0 child-tabs"
            :pt="{
              root: { class: 'flex-1 flex flex-col min-h-0' },
              panelContainer: { class: 'flex-1 min-h-0 overflow-hidden' },
              nav: { class: 'child-nav bg-surface-50 dark:bg-surface-800/50' }
            }"
          >
            <!-- List tab (parent content) -->
            <TabPanel
              :pt="{
                root: { class: 'h-full' },
                content: { class: 'h-full overflow-auto p-4' }
              }"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <i class="pi pi-table text-xs" />
                  <span>{{ $t('tabs.list') }}</span>
                </div>
              </template>
              <component 
                v-if="tab.component"
                :is="getComponent(tab.component)"
                :tabId="tab.id_tab"
                :objectType="tab.objectType"
              />
            </TabPanel>

            <!-- Child tabs -->
            <TabPanel 
              v-for="childTab in getChildTabs(tab.id_tab)" 
              :key="childTab.id_tab"
              :pt="{
                root: { class: 'h-full' },
                content: { class: 'h-full overflow-auto p-4' }
              }"
            >
              <template #header>
                <div class="flex items-center gap-2">
                  <i v-if="childTab.icon" :class="childTab.icon" class="text-xs" />
                  <span :title="childTab.label">{{ truncateLabel(childTab.label, 25) }}</span>
                  <button 
                    class="close-btn w-4 h-4 flex items-center justify-center rounded-full hover:bg-surface-300 dark:hover:bg-surface-500 transition-all duration-200"
                    @click.stop="tabsStore.closeTab(childTab.id_tab)"
                  >
                    <i class="pi pi-times" style="font-size: 0.6rem" />
                  </button>
                </div>
              </template>
              <component 
                v-if="childTab.component"
                :is="getComponent(childTab.component)"
                :mode="childTab.mode"
                :objectId="childTab.objectId"
                :tabId="childTab.id_tab"
                :objectType="childTab.objectType"
                :objectTypeData="childTab.objectTypeData"
              />
            </TabPanel>
          </TabView>

          <!-- Simple content for components without child tabs -->
          <div v-else class="h-full overflow-auto p-4">
            <component 
              v-if="tab.component"
              :is="getComponent(tab.component)"
              :tabId="tab.id_tab"
              :objectType="tab.objectType"
            />
            <div v-else class="text-surface-500">
              {{ $t('tabs.noContent') }}
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTabsStore } from '@/stores/tabsStore'
import { useI18n } from 'vue-i18n'
import { markRaw, defineAsyncComponent } from 'vue'

// PrimeVue components
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

// Components registry
const componentRegistry = {
  ObjectsCrud: markRaw(defineAsyncComponent(() => import('@/components/crud/ObjectsCrud.vue'))),
  ObjectDetail: markRaw(defineAsyncComponent(() => import('@/components/crud/ObjectDetail.vue'))),
  LanguagesCrud: markRaw(defineAsyncComponent(() => import('@/components/crud/LanguagesCrud.vue'))),
  MetadataObjectTypesCrud: markRaw(defineAsyncComponent(() => import('@/components/crud/MetadataObjectTypesCrud.vue'))),
  MetadataObjectFieldsCrud: markRaw(defineAsyncComponent(() => import('@/components/crud/MetadataObjectFieldsCrud.vue'))),
  AuditView: markRaw(defineAsyncComponent(() => import('@/components/crud/AuditView.vue'))),
}

// Components that support child tabs
const componentsWithChildTabs = ['ObjectsCrud', 'MetadataObjectTypesCrud']

const tabsStore = useTabsStore()
const { t } = useI18n()

// Computed: active parent tab index
const activeParentIndex = computed(() => {
  const index = tabsStore.parentTabs.findIndex(tab => tab.id_tab === tabsStore.activeTabId)
  return index >= 0 ? index : 0
})

// Check if a parent tab has child tabs support
const hasChildTabs = (tab) => {
  return componentsWithChildTabs.includes(tab.component)
}

// Get child tabs for a parent
const getChildTabs = (parentId) => {
  return tabsStore.tabs.filter(tab => tab.parentId === parentId)
}

// Get active child tab index (0 = list, 1+ = child tabs)
const getChildTabIndex = (parentId) => {
  if (tabsStore.activeTabId !== parentId) return 0
  if (!tabsStore.activeChildTabId) return 0
  
  const childTabs = getChildTabs(parentId)
  const childIndex = childTabs.findIndex(tab => tab.id_tab === tabsStore.activeChildTabId)
  return childIndex >= 0 ? childIndex + 1 : 0
}

// Handle parent tab change
const onParentTabChange = (index) => {
  const tab = tabsStore.parentTabs[index]
  if (tab) {
    tabsStore.switchTab(tab.id_tab)
  }
}

// Handle child tab change
const onChildTabChange = (parentId, index) => {
  if (index === 0) {
    // Back to list
    tabsStore.switchTab(parentId)
  } else {
    // Switch to child tab
    const childTabs = getChildTabs(parentId)
    const childTab = childTabs[index - 1]
    if (childTab) {
      tabsStore.switchChildTab(childTab.id_tab)
    }
  }
}

// Close parent tab
const closeParentTab = (tabId) => {
  tabsStore.closeTab(tabId)
}

const getComponent = (componentName) => {
  return componentRegistry[componentName] || null
}

const getTabLabel = (tab) => {
  if (tab.labelKey) {
    return t(tab.labelKey)
  }
  return tab.label || t('tabs.untitled')
}

const truncateLabel = (label, maxLength) => {
  if (!label) return t('tabs.untitled')
  if (label.length <= maxLength) return label
  return label.substring(0, maxLength) + '...'
}
</script>

<style scoped>
/* Parent tabs styling */
.parent-tabs :deep(.p-tabview-nav) {
  background: transparent;
  border: none;
  gap: 0.25rem;
  padding: 0.5rem 0.5rem 0;
}

.parent-tabs :deep(.p-tabview-nav-link) {
  background: var(--p-surface-100);
  border: none;
  border-radius: 0.5rem 0.5rem 0 0;
  padding: 0.625rem 1rem;
  margin: 0;
  transition: all 0.2s ease;
}

.parent-tabs :deep(.p-tabview-nav-link:not(.p-disabled):focus-visible) {
  outline: none;
  box-shadow: none;
}

.parent-tabs :deep(.p-tabview-nav-link:hover:not(.p-highlight)) {
  background: var(--p-surface-200);
}

.parent-tabs :deep(.p-tabview-nav-link.p-highlight) {
  background: var(--p-primary-50);
  color: var(--p-primary-700);
}

.parent-tabs :deep(.p-tabview-ink-bar) {
  background: var(--p-primary-500);
  height: 3px;
  border-radius: 3px 3px 0 0;
}

.parent-tabs :deep(.p-tabview-panels) {
  background: transparent;
  padding: 0;
  flex: 1;
  min-height: 0;
}

/* Child tabs styling */
.child-tabs :deep(.p-tabview-nav) {
  background: var(--p-surface-50);
  border: none;
  gap: 0.25rem;
  padding: 0.375rem 0.5rem;
}

.child-tabs :deep(.p-tabview-nav-link) {
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  margin: 0;
  transition: all 0.2s ease;
}

.child-tabs :deep(.p-tabview-nav-link:hover:not(.p-highlight)) {
  background: var(--p-surface-200);
}

.child-tabs :deep(.p-tabview-nav-link.p-highlight) {
  background: var(--p-primary-100);
  color: var(--p-primary-700);
}

.child-tabs :deep(.p-tabview-ink-bar) {
  background: var(--p-primary-500);
  height: 2px;
  border-radius: 2px 2px 0 0;
}

.child-tabs :deep(.p-tabview-panels) {
  background: transparent;
  padding: 0;
  flex: 1;
  min-height: 0;
}

/* Dark mode */
.dark .parent-tabs :deep(.p-tabview-nav-link) {
  background: var(--p-surface-800);
}

.dark .parent-tabs :deep(.p-tabview-nav-link:hover:not(.p-highlight)) {
  background: var(--p-surface-700);
}

.dark .parent-tabs :deep(.p-tabview-nav-link.p-highlight) {
  background: var(--p-primary-900);
  color: var(--p-primary-300);
}

.dark .child-tabs :deep(.p-tabview-nav) {
  background: var(--p-surface-800);
}

.dark .child-tabs :deep(.p-tabview-nav-link:hover:not(.p-highlight)) {
  background: var(--p-surface-700);
}

.dark .child-tabs :deep(.p-tabview-nav-link.p-highlight) {
  background: var(--p-primary-900);
  color: var(--p-primary-300);
}

/* Close button styling */
.close-btn {
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1;
}

/* Scrollbar styling */
:deep(.p-tabview-nav-container) {
  overflow-x: auto;
}

:deep(.p-tabview-nav-container::-webkit-scrollbar) {
  height: 4px;
}

:deep(.p-tabview-nav-container::-webkit-scrollbar-thumb) {
  background: var(--p-surface-300);
  border-radius: 2px;
}

.dark :deep(.p-tabview-nav-container::-webkit-scrollbar-thumb) {
  background: var(--p-surface-600);
}
</style>
