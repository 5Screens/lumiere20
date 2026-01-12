<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-900">
    <div class="w-full max-w-md p-8">
      <Card>
        <template #title>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-primary">{{ $t('auth.title') }}</h1>
            <p v-if="portalName" class="text-sm text-surface-500 mt-1">{{ portalName }}</p>
          </div>
        </template>
        <template #content>
          <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label for="email" class="font-semibold">{{ $t('auth.email') }}</label>
              <InputText 
                id="email" 
                v-model="form.email" 
                type="email" 
                :placeholder="$t('auth.emailPlaceholder')"
                fluid
                autofocus
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="password" class="font-semibold">{{ $t('auth.password') }}</label>
              <Password 
                id="password" 
                v-model="form.password" 
                :placeholder="$t('auth.passwordPlaceholder')"
                :feedback="false"
                toggleMask
                fluid
              />
            </div>
            <Button 
              type="submit" 
              :label="$t('auth.login')" 
              icon="pi pi-sign-in" 
              :loading="authStore.loading"
              class="mt-2"
            />
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/authStore'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()
const { t } = useI18n()

const form = ref({
  email: '',
  password: ''
})

const portalName = computed(() => route.query.portal || null)

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    toast.add({ severity: 'warn', summary: t('common.warning'), detail: t('auth.fillAllFields'), life: 3000 })
    return
  }

  try {
    await authStore.login(form.value)
    toast.add({ severity: 'success', summary: t('common.success'), detail: t('auth.loginSuccess'), life: 3000 })
    
    // Redirect to original portal or default
    const redirect = route.query.redirect || '/demo'
    router.push(redirect)
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: t('common.error'), 
      detail: error.message || t('auth.loginFailed'), 
      life: 3000 
    })
  }
}
</script>
