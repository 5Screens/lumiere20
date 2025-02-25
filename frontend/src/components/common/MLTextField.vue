<template>
  <div class="ml-text-field">
    <label v-if="label" class="ml-text-field__label">
      {{ label }}
      <span v-if="required" class="ml-text-field__required">*</span>
    </label>
    <div class="ml-text-field__container">
      <div 
        v-for="lang in languages" 
        :key="lang" 
        class="ml-text-field__input-group"
      >
        <div class="ml-text-field__flag">
          {{ getFlagEmoji(lang) }}
        </div>
        <input
          type="text"
          class="ml-text-field__input"
          :value="modelValue[lang] || ''"
          @input="updateValue(lang, $event.target.value)"
          :readonly="readonly"
          :disabled="disabled"
          :required="required"
          :placeholder="lang.toUpperCase()"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import '@/assets/styles/MLTextField.css';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  languages: {
    type: Array,
    required: true
  },
  label: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

const getFlagEmoji = (langCode) => {
  // Convertir le code de langue en code de pays pour les drapeaux emoji
  // Les codes de pays sont des lettres majuscules, donc on convertit chaque lettre
  // en son équivalent Unicode Regional Indicator Symbol
  if (langCode.length !== 2) return '🌐'; // Fallback pour les codes non standard
  
  const codePoints = langCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

const updateValue = (lang, value) => {
  // Créer une copie de l'objet modelValue pour éviter la mutation directe
  const updatedValue = { ...props.modelValue };
  // Mettre à jour uniquement la langue modifiée
  updatedValue[lang] = value;
  // Émettre l'objet complet mis à jour
  emit('update:modelValue', updatedValue);
};
</script>
