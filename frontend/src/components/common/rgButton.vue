<template>
  <div class="rg-button-container">
    <button
      v-if="showConfirm"
      class="rg-button rg-button--confirm"
      @click="handleConfirm"
      :disabled="disabled"
      :aria-label="t('common.confirm_edit')"
    >
      ✓
    </button>
    <button
      v-if="showCancel"
      class="rg-button rg-button--cancel"
      @click="handleCancel"
      :disabled="disabled"
      :aria-label="t('common.cancel_edit')"
    >
      ✕
    </button>
  </div>
</template>

<script>
import { useI18n } from 'vue-i18n'
import '@/assets/styles/rgButton.css'

export default {
  name: 'RgButton',
  props: {
    showConfirm: {
      type: Boolean,
      default: true
    },
    showCancel: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const { t } = useI18n()

    const handleConfirm = () => {
      emit('confirm')
    }

    const handleCancel = () => {
      emit('cancel')
    }

    return {
      handleConfirm,
      handleCancel,
      t
    }
  }
}
</script>
