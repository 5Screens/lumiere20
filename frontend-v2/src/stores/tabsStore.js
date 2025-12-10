import { defineStore } from 'pinia'
import { v4 as uuidv4 } from 'uuid'

/**
 * Store for hierarchical tabs management
 * Supports parent tabs (main views) and child tabs (edit forms)
 */
export const useTabsStore = defineStore('tabs', {
  state: () => ({
    // List of open tabs
    tabs: [],
    // Active parent tab ID
    activeTabId: null,
    // Active child tab ID
    activeChildTabId: null,
    // Last active child tab per parent (to restore when switching back)
    lastActiveChildByParent: {}
  }),
  
  actions: {
    /**
     * Opens a new tab or activates existing one
     * @param {Object} tab - Tab data to open
     */
    openTab(tab) {
      console.log('[TabsStore] Opening tab:', tab)
      
      // Check if tab with same id already exists
      if (tab.id) {
        const existingTab = this.tabs.find(t => t.id === tab.id)
        if (existingTab) {
          console.log('[TabsStore] Tab already exists, activating:', existingTab)
          this.activateTab(existingTab.id_tab)
          return
        }
      }
      
      // Check if tab with same objectId already exists
      if (tab.objectId) {
        const existingTab = this.tabs.find(t => 
          t.objectId === tab.objectId && 
          t.objectType === tab.objectType &&
          t.parentId === tab.parentId
        )
        if (existingTab) {
          console.log('[TabsStore] Tab with same objectId exists, activating:', existingTab)
          this.activateTab(existingTab.id_tab)
          return
        }
      }
      
      // Create new tab
      const newTab = {
        ...tab,
        id_tab: uuidv4(),
        isActive: false
      }
      
      // If it's a child tab
      if (tab.parentId) {
        const parentExists = this.tabs.some(t => t.id_tab === tab.parentId)
        if (!parentExists) {
          console.warn('[TabsStore] Parent tab not found:', tab.parentId)
          return
        }
        
        // Deactivate all tabs
        this.tabs.forEach(t => t.isActive = false)
        
        // Activate new child tab
        newTab.isActive = true
        this.activeChildTabId = newTab.id_tab
        this.activeTabId = tab.parentId
      } else {
        // Parent tab
        this.tabs.forEach(t => t.isActive = false)
        newTab.isActive = true
        this.activeTabId = newTab.id_tab
        this.activeChildTabId = null
      }
      
      this.tabs.push(newTab)
    },

    /**
     * Closes a tab and its children
     * @param {string} id_tab - Tab ID to close
     */
    closeTab(id_tab) {
      console.log('[TabsStore] Closing tab:', id_tab)
      
      const tabToClose = this.tabs.find(t => t.id_tab === id_tab)
      if (!tabToClose) return
      
      const isChildTab = !!tabToClose.parentId
      const parentId = tabToClose.parentId
      
      // If parent tab, close children first and clean up lastActiveChildByParent
      if (!isChildTab) {
        this.tabs = this.tabs.filter(t => t.parentId !== id_tab)
        delete this.lastActiveChildByParent[id_tab]
      }
      
      // Remove the tab
      const tabIndex = this.tabs.findIndex(t => t.id_tab === id_tab)
      if (tabIndex === -1) return
      this.tabs.splice(tabIndex, 1)
      
      // Handle activation of next tab
      if (isChildTab) {
        // Clean up lastActiveChildByParent if this was the last active child
        if (this.lastActiveChildByParent[parentId] === id_tab) {
          delete this.lastActiveChildByParent[parentId]
        }
        
        if (this.activeChildTabId === id_tab) {
          const siblingTabs = this.tabs.filter(t => t.parentId === parentId)
          
          if (siblingTabs.length > 0) {
            const prevChildTab = siblingTabs[siblingTabs.length - 1]
            this.activeChildTabId = prevChildTab.id_tab
            this.lastActiveChildByParent[parentId] = prevChildTab.id_tab
            this.tabs.forEach(t => t.isActive = (t.id_tab === prevChildTab.id_tab))
          } else {
            this.activeChildTabId = null
            delete this.lastActiveChildByParent[parentId]
            this.tabs.forEach(t => t.isActive = (t.id_tab === parentId))
          }
        }
      } else {
        if (this.activeTabId === id_tab) {
          const remainingTabs = this.tabs.filter(t => !t.parentId)
          const prevTab = remainingTabs[remainingTabs.length - 1]
          
          if (prevTab) {
            this.activeTabId = prevTab.id_tab
            this.activeChildTabId = null
            this.tabs.forEach(t => t.isActive = (t.id_tab === prevTab.id_tab))
          } else {
            this.activeTabId = null
            this.activeChildTabId = null
          }
        }
      }
    },

    /**
     * Activates a tab by its ID
     * @param {string} id_tab - Tab ID to activate
     */
    activateTab(id_tab) {
      console.log('[TabsStore] Activating tab:', id_tab)
      
      const tab = this.tabs.find(t => t.id_tab === id_tab)
      if (!tab) return
      
      this.tabs.forEach(t => t.isActive = false)
      tab.isActive = true
      
      if (tab.parentId) {
        this.activeChildTabId = id_tab
        this.activeTabId = tab.parentId
      } else {
        this.activeTabId = id_tab
        this.activeChildTabId = null
      }
    },

    /**
     * Switches to a parent tab
     * @param {string} id_tab - Parent tab ID
     */
    switchTab(id_tab) {
      console.log('[TabsStore] Switching to parent tab:', id_tab)
      
      const tab = this.tabs.find(t => t.id_tab === id_tab && !t.parentId)
      if (!tab) return false
      
      // Save current child tab for current parent before switching
      if (this.activeTabId && this.activeChildTabId) {
        this.lastActiveChildByParent[this.activeTabId] = this.activeChildTabId
      }
      
      if (this.activeTabId === id_tab && !this.activeChildTabId && tab.isActive) {
        return true // Already active
      }
      
      // Restore last active child tab for this parent if exists
      const lastChildId = this.lastActiveChildByParent[id_tab]
      const lastChildTab = lastChildId ? this.tabs.find(t => t.id_tab === lastChildId) : null
      
      if (lastChildTab) {
        // Restore to last active child tab
        this.tabs.forEach(t => t.isActive = (t.id_tab === lastChildId))
        this.activeTabId = id_tab
        this.activeChildTabId = lastChildId
      } else {
        // No child tab to restore, show list
        this.tabs.forEach(t => t.isActive = (t.id_tab === id_tab))
        this.activeTabId = id_tab
        this.activeChildTabId = null
      }
      
      return false
    },

    /**
     * Switches to a child tab
     * @param {string} id_tab - Child tab ID
     */
    switchChildTab(id_tab) {
      console.log('[TabsStore] Switching to child tab:', id_tab)
      
      const childTab = this.tabs.find(t => t.id_tab === id_tab && t.parentId)
      if (!childTab) return false
      
      if (this.activeChildTabId === id_tab && childTab.isActive) {
        return true // Already active
      }
      
      this.tabs.forEach(t => t.isActive = (t.id_tab === id_tab))
      this.activeChildTabId = id_tab
      this.activeTabId = childTab.parentId
      
      return false
    },

    /**
     * Updates tab data
     * @param {string} id_tab - Tab ID
     * @param {Object} data - Data to update
     */
    updateTab(id_tab, data) {
      const tab = this.tabs.find(t => t.id_tab === id_tab)
      if (tab) {
        Object.assign(tab, data)
      }
    },

    /**
     * Reorders parent tabs after drag & drop
     * @param {Array} newOrder - New array of parent tabs in desired order
     */
    reorderParentTabs(newOrder) {
      console.log('[TabsStore] Reordering parent tabs')
      
      // Get child tabs (they keep their position relative to parents)
      const childTabs = this.tabs.filter(t => t.parentId)
      
      // Replace tabs with new order + children
      this.tabs = [...newOrder, ...childTabs]
    },

    /**
     * Reorders child tabs of a parent after drag & drop
     * @param {string} parentId - Parent tab ID
     * @param {Array} newOrder - New array of child tabs in desired order
     */
    reorderChildTabs(parentId, newOrder) {
      console.log('[TabsStore] Reordering child tabs for parent:', parentId)
      
      // Get all tabs except children of this parent
      const otherTabs = this.tabs.filter(t => t.parentId !== parentId)
      
      // Get parent tabs and other children in order
      const parentTabs = otherTabs.filter(t => !t.parentId)
      const otherChildTabs = otherTabs.filter(t => t.parentId)
      
      // Rebuild tabs array maintaining structure
      this.tabs = [...parentTabs, ...newOrder, ...otherChildTabs]
    }
  },

  getters: {
    /**
     * Returns parent tabs only
     */
    parentTabs: (state) => state.tabs.filter(tab => !tab.parentId),

    /**
     * Returns child tabs of active parent
     */
    activeChildTabs: (state) => state.tabs.filter(tab => tab.parentId === state.activeTabId),

    /**
     * Checks if a parent tab is truly active (no child active)
     */
    isParentTabActive: (state) => (tabId) => {
      return state.activeTabId === tabId && !state.activeChildTabId
    },

    /**
     * Returns the active parent tab
     */
    activeTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeTabId),

    /**
     * Returns the active child tab
     */
    activeChildTab: (state) => state.tabs.find(tab => tab.id_tab === state.activeChildTabId),

    /**
     * Returns the currently displayed tab (child or parent)
     */
    currentTab: (state) => {
      if (state.activeChildTabId) {
        return state.tabs.find(tab => tab.id_tab === state.activeChildTabId)
      }
      return state.tabs.find(tab => tab.id_tab === state.activeTabId)
    }
  },

  persist: {
    key: 'tabs-store-v3',
    storage: localStorage,
    paths: ['tabs', 'activeTabId', 'activeChildTabId', 'lastActiveChildByParent']
  }
})
