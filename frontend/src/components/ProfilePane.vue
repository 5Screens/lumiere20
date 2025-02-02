<template>
  <transition name="slide-down">
    <div v-if="isVisible" class="profile-pane">
      <div class="theme-section">
        <h3>Theme</h3>
        <div class="theme-buttons">
          <button @click="setTheme('light')" :class="{ active: currentTheme === 'light' }">
            <i class="fas fa-sun"></i>
          </button>
          <button @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }">
            <i class="fas fa-moon"></i>
          </button>
        </div>
      </div>
      <div class="language-section">
        <h3>Langue</h3>
        <select v-model="currentLanguage" @change="changeLanguage">
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
          <option value="es">Español</option>
        </select>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'ProfilePane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentTheme: 'light',
      currentLanguage: 'fr'
    }
  },
  methods: {
    setTheme(theme) {
      this.currentTheme = theme;
      document.body.setAttribute('data-theme', theme);
      // Émettre un événement pour informer le parent
      this.$emit('theme-changed', theme);
    },
    changeLanguage() {
      // Émettre un événement pour informer le parent
      this.$emit('language-changed', this.currentLanguage);
    }
  }
}
</script>

<style scoped>
.profile-pane {
  position: fixed;
  top: 60px;
  right: 20px;
  width: 250px;
  height: 200px;
  background: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 1000;
}

.slide-down-enter-active {
  animation: slide-down 0.3s ease-out;
}

.slide-down-leave-active {
  animation: slide-down 0.3s ease-out reverse;
}

@keyframes slide-down {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.theme-section, .language-section {
  margin-bottom: 1rem;
}

h3 {
  margin-bottom: 0.5rem;
  font-size: 1rem;
  color: var(--text-color);
}

.theme-buttons {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

button:hover {
  background: var(--hover-color);
}

button.active {
  background: var(--primary-color);
  color: white;
}

select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
}
</style>
