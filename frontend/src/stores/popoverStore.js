import { defineStore } from 'pinia'

export const usePopoverStore = defineStore('popover', {
  state: () => ({
    isVisible: false,
    content: '',
    format: null,
    position: { x: 0, y: 0 },
    sourceElement: null
  }),

  actions: {
    showPopover(content, format, x, y, sourceElement = null) {
      this.content = content
      this.format = format
      this.position = { x, y }
      this.sourceElement = sourceElement
      this.isVisible = true
    },

    hidePopover() {
      this.isVisible = false
      this.content = ''
      this.format = null
      this.position = { x: 0, y: 0 }
      this.sourceElement = null
    }
  }
})
