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

    <!-- Primary Tabs (parent level) - PrimeVue v4 -->
    <Tabs 
      v-else
      :value="activeParentValue"
      @update:value="onParentTabChange"
      scrollable
      class="flex-1 flex flex-col min-h-0"
    >
      <TabList class="bg-transparent border-none gap-1 px-2 pt-2">
        <Tab 
          v-for="tab in tabsStore.parentTabs" 
          :key="tab.id_tab"
          :value="tab.id_tab"
          class="bg-surface-100 dark:bg-surface-800 rounded-t-lg px-4 py-2.5 transition-all duration-200 hover:bg-surface-200 dark:hover:bg-surface-700"
        >
          <div class="flex items-center gap-2">
            <i v-if="tab.icon" :class="tab.icon" class="text-sm" />
            <span>{{ getTabLabel(tab) }}</span>
            <button 
              class="ml-1 w-5 h-5 flex items-center justify-center rounded-full hover:bg-surface-300 dark:hover:bg-surface-600 transition-all duration-200 opacity-60 hover:opacity-100"
              @click.stop="closeParentTab(tab.id_tab)"
            >
              <i class="pi pi-times text-xs" />
            </button>
          </div>
        </Tab>
      </TabList>

      <TabPanels class="flex-1 min-h-0 overflow-hidden">
        <TabPanel 
          v-for="tab in tabsStore.parentTabs" 
          :key="tab.id_tab"
          :value="tab.id_tab"
          class="h-full flex flex-col p-0"
        >
          <!-- Content with child tabs support -->
          <div class="h-full flex flex-col">
            <!-- Secondary Tabs (child level) - smaller -->
            <Tabs 
              v-if="hasChildTabs(tab)"
              :value="getChildTabValue(tab.id_tab)"
              @update:value="(value) => onChildTabChange(tab.id_tab, value)"
              scrollable
              class="flex-1 flex flex-col min-h-0"
            >
              <TabList class="bg-surface-50 dark:bg-surface-800/50 border-none gap-1 px-2 py-1.5">
                <!-- List tab -->
                <Tab 
                  :value="'list-' + tab.id_tab"
                  class="rounded px-3 py-1.5 text-sm transition-all duration-200 hover:bg-surface-200 dark:hover:bg-surface-700"
                >
                  <div class="flex items-center gap-1">
                    <i class="pi pi-table" style="font-size: 0.65rem" />
                    <span>{{ $t('tabs.list') }}</span>
                  </div>
                </Tab>

                <!-- Child tabs -->
                <Tab 
                  v-for="childTab in getChildTabs(tab.id_tab)" 
                  :key="childTab.id_tab"
                  :value="childTab.id_tab"
                  class="rounded px-3 py-1.5 text-sm transition-all duration-200 hover:bg-surface-200 dark:hover:bg-surface-700"
                >
                  <div class="flex items-center gap-1">
                    <i v-if="childTab.icon" :class="childTab.icon" style="font-size: 0.65rem" />
                    <span :title="childTab.label">{{ truncateLabel(childTab.label, 25) }}</span>
                    <button 
                      class="w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-surface-300 dark:hover:bg-surface-500 transition-all duration-200 opacity-60 hover:opacity-100"
                      @click.stop="tabsStore.closeTab(childTab.id_tab)"
                    >
                      <i class="pi pi-times" style="font-size: 0.5rem" />
                    </button>
                  </div>
                </Tab>
              </TabList>

              <TabPanels class="flex-1 min-h-0 overflow-hidden">
                <!-- List panel -->
                <TabPanel :value="'list-' + tab.id_tab" class="h-full overflow-auto p-4">
                  <component 
                    v-if="tab.component"
                    :is="getComponent(tab.component)"
                    :tabId="tab.id_tab"
                    :objectType="tab.objectType"
                  />
                </TabPanel>

                <!-- Child panels -->
                <TabPanel 
                  v-for="childTab in getChildTabs(tab.id_tab)" 
                  :key="childTab.id_tab"
                  :value="childTab.id_tab"
                  class="h-full overflow-auto p-4"
                >
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
              </TabPanels>
            </Tabs>

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
      </TabPanels>
    </Tabs>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTabsStore } from '@/stores/tabsStore'
import { useI18n } from 'vue-i18n'
import { markRaw, defineAsyncComponent } from 'vue'

// PrimeVue v4 Tabs components
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
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

// Computed: active parent tab value (id_tab)
const activeParentValue = computed(() => {
  return tabsStore.activeTabId || tabsStore.parentTabs[0]?.id_tab
})

// Check if a parent tab has child tabs support
const hasChildTabs = (tab) => {
  return componentsWithChildTabs.includes(tab.component)
}

// Get child tabs for a parent
const getChildTabs = (parentId) => {
  return tabsStore.tabs.filter(tab => tab.parentId === parentId)
}

// Get active child tab value
const getChildTabValue = (parentId) => {
  if (tabsStore.activeTabId !== parentId) return 'list-' + parentId
  if (!tabsStore.activeChildTabId) return 'list-' + parentId
  return tabsStore.activeChildTabId
}

// Handle parent tab change
const onParentTabChange = (value) => {
  if (value) {
    tabsStore.switchTab(value)
  }
}

// Handle child tab change
const onChildTabChange = (parentId, value) => {
  if (value === 'list-' + parentId) {
    // Back to list
    tabsStore.switchTab(parentId)
  } else {
    // Switch to child tab
    tabsStore.switchChildTab(value)
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

