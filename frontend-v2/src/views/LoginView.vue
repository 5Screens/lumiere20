<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50">
    <div class="w-full max-w-md p-8">
      <Card>
        <template #title>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-primary">Lumiere V2</h1>
            <p class="text-surface-500 mt-2">{{ $t('auth.loginTitle') }}</p>
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
          <Divider align="center">
            <span class="text-surface-400">{{ $t('auth.or') }}</span>
          </Divider>
          <div class="text-center">
            <router-link to="/register" class="text-primary hover:underline">
              {{ $t('auth.noAccount') }}
            </router-link>
          </div>
        </template>
      </Card>
    </div>
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

const form = ref({
  email: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.value.email || !form.value.password) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all fields', life: 3000 })
    return
  }

  try {
    await authStore.login(form.value)
    toast.add({ severity: 'success', summary: 'Success', detail: 'Login successful', life: 3000 })
    router.push('/')
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Login failed', 
      life: 3000 
    })
  }
}
</script>
