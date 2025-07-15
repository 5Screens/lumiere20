<template>
  <Teleport to="body">
    <div v-if="isVisible" class="yes-no-modal-overlay" @click.self="handleCancel">
      <div class="yes-no-modal">
          <div class="yes-no-modal__header">
            <h3>{{ t('yesNoModal.confirmation') }}</h3>
          </div>
          <div class="yes-no-modal__message">
            {{ confirmationToDisplay }}
          </div>
          <div class="yes-no-modal__actions">
            <button 
              class="yes-no-modal__button yes-no-modal__button--cancel" 
              @click="handleCancel"
            >
              {{ t('yesNoModal.no') }}
            </button>
            <button 
              class="yes-no-modal__button yes-no-modal__button--confirm" 
              @click="handleConfirm"
            >
              {{ t('yesNoModal.yes') }}
            </button>
          </div>
        </div>
      </div>
  </Teleport>
</template>

<script>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import '@/assets/styles/yesNoModal.css'

export default {
  name: 'YesNoModal',
  props: {
    confirmationToDisplay: {
      type: String,
      required: false,
      default: ''
    },
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'confirm', 'cancel'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const isVisible = ref(props.modelValue)

    // Watch for changes to modelValue prop
    watch(() => props.modelValue, (newValue) => {
      console.log('[YesNoModal] modelValue changé:', newValue, 'message:', props.confirmationToDisplay)
      // Ne mettre à jour isVisible que si la valeur est true (ouverture)
      // La fermeture est gérée par handleConfirm/handleCancel
      if (newValue) {
        isVisible.value = true
      }
    })

    // Handle confirm action
    const handleConfirm = () => {
      console.log('[YesNoModal] Confirmation acceptée')
      isVisible.value = false
      emit('update:modelValue', false)
      emit('confirm', true)
    }

    // Handle cancel action
    const handleCancel = () => {
      console.log('[YesNoModal] Confirmation annulée')
      isVisible.value = false
      emit('update:modelValue', false)
      emit('cancel', false)
    }

    return {
      isVisible,
      handleConfirm,
      handleCancel,
      t
    }
  }
}
</script>
