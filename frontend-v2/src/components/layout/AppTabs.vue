<template>
  <div class="app-tabs h-full flex flex-col">
    <!-- Primary tabs (parent level) -->
    <div v-if="tabsStore.parentTabs.length > 0" class="tabs-header border-b border-surface-200 dark:border-surface-700">
      <div class="flex items-center gap-1 px-2 py-1 overflow-x-auto">
        <div 
          v-for="tab in tabsStore.parentTabs" 
          :key="tab.id_tab"
          class="tab-item flex items-center gap-2 px-3 py-2 rounded-t-lg cursor-pointer transition-colors whitespace-nowrap"
          :class="{
            'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-b-2 border-primary-500': tabsStore.isParentTabActive(tab.id_tab),
            'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700': !tabsStore.isParentTabActive(tab.id_tab) && tabsStore.activeTabId !== tab.id_tab,
            'bg-surface-50 dark:bg-surface-800/50 text-surface-500 dark:text-surface-500': tabsStore.activeTabId === tab.id_tab && tabsStore.activeChildTabId
          }"
          @click="handleParentTabClick(tab)"
        >
          <i v-if="tab.icon" :class="tab.icon" class="text-sm" />
          <span class="text-sm font-medium">{{ getTabLabel(tab) }}</span>
          <button 
            class="close-btn ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors"
            @click.stop="tabsStore.closeTab(tab.id_tab)"
          >
            <i class="pi pi-times text-xs" />
          </button>
        </div>
      </div>
    </div>

    <!-- Secondary tabs (child level) -->
    <div v-if="tabsStore.activeChildTabs.length > 0" class="child-tabs-header border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
      <div class="flex items-center gap-1 px-2 py-1 overflow-x-auto">
        <!-- Back to parent tab button -->
        <div 
          class="tab-item flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors whitespace-nowrap"
          :class="{
            'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300': tabsStore.isParentTabActive(tabsStore.activeTabId),
            'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600': !tabsStore.isParentTabActive(tabsStore.activeTabId)
          }"
          @click="handleBackToParent"
        >
          <i class="pi pi-table text-xs" />
          <span class="text-xs">{{ $t('tabs.backToList') }}</span>
        </div>

        <div class="w-px h-4 bg-surface-300 dark:bg-surface-600 mx-1" />

        <!-- Child tabs -->
        <div 
          v-for="tab in tabsStore.activeChildTabs" 
          :key="tab.id_tab"
          class="tab-item flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer transition-colors whitespace-nowrap"
          :class="{
            'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300': tabsStore.activeChildTabId === tab.id_tab,
            'bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-300 dark:hover:bg-surface-600': tabsStore.activeChildTabId !== tab.id_tab
          }"
          @click="handleChildTabClick(tab)"
        >
          <i v-if="tab.icon" :class="tab.icon" class="text-xs" />
          <span class="text-xs font-medium" :title="tab.label">
            {{ truncateLabel(tab.label, 20) }}
          </span>
          <button 
            class="close-btn w-4 h-4 flex items-center justify-center rounded hover:bg-surface-400 dark:hover:bg-surface-500 transition-colors"
            @click.stop="tabsStore.closeTab(tab.id_tab)"
          >
            <i class="pi pi-times" style="font-size: 0.6rem" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab content -->
    <div class="tab-content flex-1 overflow-hidden">
      <!-- Parent tab content -->
      <template v-for="tab in tabsStore.parentTabs" :key="tab.id_tab">
        <div 
          v-show="tabsStore.isParentTabActive(tab.id_tab)"
          class="h-full overflow-auto p-4"
        >
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
      </template>

      <!-- Child tab content -->
      <template v-for="tab in tabsStore.tabs.filter(t => t.parentId)" :key="tab.id_tab">
        <div 
          v-show="tabsStore.activeChildTabId === tab.id_tab"
          class="h-full overflow-auto p-4"
        >
          <component 
            v-if="tab.component"
            :is="getComponent(tab.component)"
            :mode="tab.mode"
            :objectId="tab.objectId"
            :tabId="tab.id_tab"
            :objectType="tab.objectType"
          />
          <div v-else class="text-surface-500">
            {{ $t('tabs.noContent') }}
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div 
        v-if="tabsStore.parentTabs.length === 0"
        class="h-full flex items-center justify-center text-surface-400"
      >
        <div class="text-center">
          <i class="pi pi-inbox text-4xl mb-4" />
          <p>{{ $t('tabs.noTabsOpen') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTabsStore } from '@/stores/tabsStore'
import { useI18n } from 'vue-i18n'
import { markRaw, defineAsyncComponent } from 'vue'

// Components registry
const componentRegistry = {
  ObjectsCrud: markRaw(defineAsyncComponent(() => import('@/components/crud/ObjectsCrud.vue'))),
  // Add more components as needed
}

const tabsStore = useTabsStore()
const { t } = useI18n()

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

const handleParentTabClick = (tab) => {
  if (tabsStore.isParentTabActive(tab.id_tab)) {
    return // Already active
  }
  tabsStore.switchTab(tab.id_tab)
}

const handleChildTabClick = (tab) => {
  if (tabsStore.activeChildTabId === tab.id_tab) {
    return // Already active
  }
  tabsStore.switchChildTab(tab.id_tab)
}

const handleBackToParent = () => {
  if (tabsStore.activeTabId) {
    tabsStore.switchTab(tabsStore.activeTabId)
  }
}
</script>

<style scoped>
.tabs-header::-webkit-scrollbar,
.child-tabs-header::-webkit-scrollbar {
  height: 4px;
}

.tabs-header::-webkit-scrollbar-thumb,
.child-tabs-header::-webkit-scrollbar-thumb {
  background: var(--p-surface-300);
  border-radius: 2px;
}

.dark .tabs-header::-webkit-scrollbar-thumb,
.dark .child-tabs-header::-webkit-scrollbar-thumb {
  background: var(--p-surface-600);
}
</style>
