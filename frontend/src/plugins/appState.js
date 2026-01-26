import { reactive } from 'vue'

const appState = reactive({
  theme: 'Aura',
  primaryColor: 'noir',
  surfaceColor: 'slate'
})

export default {
  install: (app) => {
    app.config.globalProperties.$appState = appState
  }
}

export { appState }
