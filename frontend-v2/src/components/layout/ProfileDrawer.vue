<template>
  <Drawer 
    v-model:visible="visible" 
    :header="$t('profile.title')" 
    position="right"
    class="w-full md:w-96"
  >
    <div class="flex flex-col gap-6">
      <!-- User avatar and info -->
      <div class="flex flex-col items-center gap-4 pb-6 border-b border-surface-200 dark:border-surface-700">
        <Avatar 
          :label="userInitials" 
          size="xlarge" 
          shape="circle"
          class="bg-primary-500 text-white"
        />
        <div class="text-center">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-100">
            {{ authStore.user?.first_name }} {{ authStore.user?.last_name }}
          </h3>
          <p class="text-sm text-surface-500 dark:text-surface-400">
            {{ authStore.user?.email }}
          </p>
          <Tag 
            v-if="authStore.user?.role" 
            :value="authStore.user.role" 
            :severity="getRoleSeverity(authStore.user.role)"
            class="mt-2"
          />
        </div>
      </div>

      <!-- Profile form -->
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide">
            {{ $t('profile.personalInfo') }}
          </h4>
          <Button 
            v-if="!editing"
            icon="pi pi-pencil" 
            severity="secondary" 
            text 
            rounded
            size="small"
            @click="startEditing"
            v-tooltip.left="$t('profile.edit')"
          />
        </div>
        
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('auth.firstName') }}</label>
          <InputText 
            v-model="form.first_name" 
            :disabled="!editing"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('auth.lastName') }}</label>
          <InputText 
            v-model="form.last_name" 
            :disabled="!editing"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('auth.email') }}</label>
          <InputText 
            v-model="form.email" 
            :disabled="true"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('profile.phone') }}</label>
          <InputText 
            v-model="form.phone" 
            :disabled="!editing"
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('profile.language') }}</label>
          <Select 
            v-model="currentLocale" 
            :options="languages" 
            :optionLabel="getLanguageLabel"
            optionValue="code"
            :disabled="!editing"
            :loading="loadingLanguages"
            class="w-full"
          />
        </div>
      </div>

      <!-- Password change section -->
      <div v-if="editing" class="flex flex-col gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
        <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide">
          {{ $t('profile.changePassword') }}
        </h4>
        
        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('profile.currentPassword') }}</label>
          <Password 
            v-model="passwordForm.currentPassword" 
            :feedback="false"
            toggleMask
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('profile.newPassword') }}</label>
          <Password 
            v-model="passwordForm.newPassword" 
            toggleMask
            class="w-full"
          />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-sm text-surface-600 dark:text-surface-400">{{ $t('profile.confirmNewPassword') }}</label>
          <Password 
            v-model="passwordForm.confirmPassword" 
            :feedback="false"
            toggleMask
            class="w-full"
          />
        </div>
      </div>

      <!-- Actions (only when editing) -->
      <div v-if="editing" class="flex gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button 
          :label="$t('common.cancel')"
          icon="pi pi-times"
          severity="secondary"
          @click="cancelEditing"
          class="flex-1"
        />
        <Button 
          :label="$t('common.save')"
          icon="pi pi-check"
          @click="saveProfile"
          :loading="saving"
          class="flex-1"
        />
      </div>

      <!-- Logout button -->
      <div class="pt-4 border-t border-surface-200 dark:border-surface-700">
        <Button 
          :label="$t('auth.logout')"
          icon="pi pi-sign-out"
          severity="danger"
          outlined
          @click="handleLogout"
          class="w-full"
        />
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

import Drawer from 'primevue/drawer'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Select from 'primevue/select'
import metadataService from '@/services/metadataService'
import languagesService from '@/services/languagesService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()
const { t, locale } = useI18n()

// Language
const languages = ref([])
const loadingLanguages = ref(false)

const loadLanguages = async () => {
  try {
    loadingLanguages.value = true
    languages.value = await languagesService.getActiveLanguages()
  } catch (error) {
    console.error('Error loading languages:', error)
    // Fallback to default languages if API fails
    languages.value = [
      { code: 'fr', name: 'Français', name_en: 'French' },
      { code: 'en', name: 'English', name_en: 'English' }
    ]
  } finally {
    loadingLanguages.value = false
  }
}

const getLanguageLabel = (lang) => {
  // Show native name for current locale, or name_en as fallback
  return locale.value === lang.code ? lang.name : (lang.name_en || lang.name)
}

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val
    localStorage.setItem('locale', val)
    // Clear cached data to reload with new locale translations
    metadataService.clearCache()
    // Reload current route to refresh data
    router.go(0)
  }
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editing = ref(false)
const saving = ref(false)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  phone: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const userInitials = computed(() => {
  const first = authStore.user?.first_name?.[0] || ''
  const last = authStore.user?.last_name?.[0] || ''
  return (first + last).toUpperCase() || '?'
})

const getRoleSeverity = (role) => {
  switch (role?.toUpperCase()) {
    case 'ADMIN': return 'danger'
    case 'MANAGER': return 'warn'
    case 'USER': return 'info'
    default: return 'secondary'
  }
}

const loadUserData = () => {
  if (authStore.user) {
    form.value = {
      first_name: authStore.user.first_name || '',
      last_name: authStore.user.last_name || '',
      email: authStore.user.email || '',
      phone: authStore.user.phone || ''
    }
  }
}

const startEditing = () => {
  editing.value = true
}

const cancelEditing = () => {
  editing.value = false
  loadUserData()
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

const saveProfile = async () => {
  // Validate password if changing
  if (passwordForm.value.newPassword) {
    if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      toast.add({
        severity: 'error',
        summary: t('common.error'),
        detail: t('profile.passwordMismatch'),
        life: 3000
      })
      return
    }
    if (!passwordForm.value.currentPassword) {
      toast.add({
        severity: 'error',
        summary: t('common.error'),
        detail: t('profile.currentPasswordRequired'),
        life: 3000
      })
      return
    }
  }

  try {
    saving.value = true
    
    // Update profile data
    await authStore.updateProfile({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      phone: form.value.phone
    })
    
    // Change password if provided
    if (passwordForm.value.newPassword) {
      await authStore.changePassword({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    }
    
    toast.add({
      severity: 'success',
      summary: t('common.success'),
      detail: t('profile.updateSuccess'),
      life: 3000
    })
    
    editing.value = false
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('common.error'),
      detail: error.response?.data?.message || t('profile.updateError'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const handleLogout = async () => {
  await authStore.logout()
  visible.value = false
  router.push('/login')
}

// Load user data and languages when drawer opens
watch(visible, (newValue) => {
  if (newValue) {
    loadUserData()
    loadLanguages()
    editing.value = false
  }
})
</script>

<style scoped>
:deep(.p-drawer-content) {
  padding: 1.5rem;
}

:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}
</style>
