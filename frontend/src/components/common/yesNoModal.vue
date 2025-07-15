<template>
  <Teleport to="body">
    <transition name="yes-no-modal">
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
    </transition>
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
      required: true
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
      isVisible.value = newValue
    })

    // Handle confirm action
    const handleConfirm = () => {
      isVisible.value = false
      emit('update:modelValue', false)
      emit('confirm', true)
    }

    // Handle cancel action
    const handleCancel = () => {
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
