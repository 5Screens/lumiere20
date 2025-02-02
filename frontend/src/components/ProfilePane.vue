<template>
  <transition name="slide-down">
    <div v-if="isVisible" class="profile-pane" ref="profilePane">
      <button class="close-button" @click="$emit('close')" :title="$t('common.close')">
        <i class="fas fa-times"></i>
      </button>
      <div class="theme-section">
        <h3>{{ $t('theme.title') }}</h3>
        <div class="theme-buttons">
          <button @click="setTheme('light')" :class="{ active: currentTheme === 'light' }" :title="$t('theme.light')">
            <i class="fas fa-sun"></i>
          </button>
          <button @click="setTheme('dark')" :class="{ active: currentTheme === 'dark' }" :title="$t('theme.dark')">
            <i class="fas fa-moon"></i>
          </button>
        </div>
      </div>
      <div class="language-section">
        <h3>{{ $t('language.title') }}</h3>
        <select v-model="currentLanguage" @change="changeLanguage">
          <option value="fr">{{ $t('language.fr') }}</option>
          <option value="en">{{ $t('language.en') }}</option>
          <option value="pt">{{ $t('language.pt') }}</option>
          <option value="es">{{ $t('language.es') }}</option>
        </select>
      </div>
    </div>
  </transition>
</template>

<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'ProfilePane',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const { locale } = useI18n()
    return { locale }
  },
  data() {
    return {
      currentTheme: 'light',
      currentLanguage: this.locale
    }
  },
  methods: {
    setTheme(theme) {
      this.currentTheme = theme;
      document.body.setAttribute('data-theme', theme);
      this.$emit('theme-changed', theme);
    },
    changeLanguage() {
      this.$i18n.locale = this.currentLanguage;
      this.$emit('language-changed', this.currentLanguage);
    },
    handleClickOutside(event) {
      if (this.$refs.profilePane && !this.$refs.profilePane.contains(event.target)) {
        this.$emit('close');
      }
    }
  },
  watch: {
    isVisible(newValue) {
      if (newValue) {
        // Ajouter l'écouteur d'événement quand le panneau est visible
        setTimeout(() => {
          document.addEventListener('mousedown', this.handleClickOutside);
        }, 0);
      } else {
        // Retirer l'écouteur d'événement quand le panneau est caché
        document.removeEventListener('mousedown', this.handleClickOutside);
      }
    }
  },
  beforeUnmount() {
    // Nettoyage de l'écouteur d'événement lors de la destruction du composant
    document.removeEventListener('mousedown', this.handleClickOutside);
  },
  created() {
    // Initialiser la langue actuelle
    this.currentLanguage = this.locale;
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
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 6px var(--shadow-color);
  padding: 1rem;
  z-index: 1000;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 5px;
  font-size: 1.1rem;
  color: var(--text-color);
  transition: transform 0.2s ease, color 0.2s ease;
}

.close-button:hover {
  transform: scale(1.1);
  color: var(--error-color);
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
  margin-bottom: 1.5rem;
}

h3 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  color: var(--text-color);
}

.theme-buttons {
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-color);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

button:hover {
  background: var(--hover-color);
  border-color: var(--primary-color);
}

button.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

select {
  width: 100%;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--input-bg);
  color: var(--text-color);
  cursor: pointer;
}

select:hover {
  border-color: var(--primary-color);
}

select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}
</style>
