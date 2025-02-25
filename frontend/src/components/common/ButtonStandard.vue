<template>
  <button
    :type="type"
    :class="[
      'button-standard',
      `variant-${variant}`,
      { 'button-block': block, 'button-disabled': disabled || loading }
    ]"
    :disabled="disabled || loading"
    @click="!disabled && !loading && $emit('click')"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else-if="icon" class="button-icon" :class="icon"></span>
    <span class="button-label" :class="{ 'visually-hidden': loading }">{{ label }}</span>
  </button>
</template>

<script setup>
/**
 * Composant ButtonStandard - Un bouton réutilisable et personnalisable
 * 
 * @component
 */

const props = defineProps({
  /**
   * Texte du bouton
   */
  label: {
    type: String,
    default: 'Valider'
  },
  /**
   * Type HTML du bouton
   */
  type: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  /**
   * Si true, désactive le bouton
   */
  disabled: {
    type: Boolean,
    default: false
  },
  /**
   * Si true, affiche un indicateur de chargement
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * Classe d'icône à afficher à gauche du texte
   */
  icon: {
    type: String,
    default: ''
  },
  /**
   * Si true, le bouton occupe toute la largeur
   */
  block: {
    type: Boolean,
    default: false
  },
  /**
   * Style du bouton
   */
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
  }
});

defineEmits(['click']);
</script>

<style>
@import '@/assets/styles/ButtonStandard.css';
</style>
