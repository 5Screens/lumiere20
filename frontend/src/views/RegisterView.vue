<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50">
    <div class="w-full max-w-md p-8">
      <Card>
        <template #title>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-primary">Lumiere V2</h1>
            <p class="text-surface-500 mt-2">{{ $t('auth.registerTitle') }}</p>
          </div>
        </template>
        <template #content>
          <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-2">
                <label for="first_name" class="font-semibold">{{ $t('auth.firstName') }}</label>
                <InputText 
                  id="first_name" 
                  v-model="form.first_name" 
                  :placeholder="$t('auth.firstNamePlaceholder')"
                  fluid
                  autofocus
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="last_name" class="font-semibold">{{ $t('auth.lastName') }}</label>
                <InputText 
                  id="last_name" 
                  v-model="form.last_name" 
                  :placeholder="$t('auth.lastNamePlaceholder')"
                  fluid
                />
              </div>
            </div>
            <div class="flex flex-col gap-2">
              <label for="email" class="font-semibold">{{ $t('auth.email') }}</label>
              <InputText 
                id="email" 
                v-model="form.email" 
                type="email" 
                :placeholder="$t('auth.emailPlaceholder')"
                fluid
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="password" class="font-semibold">{{ $t('auth.password') }}</label>
              <Password 
                id="password" 
                v-model="form.password" 
                :placeholder="$t('auth.passwordPlaceholder')"
                toggleMask
                fluid
              />
            </div>
            <div class="flex flex-col gap-2">
              <label for="confirmPassword" class="font-semibold">{{ $t('auth.confirmPassword') }}</label>
              <Password 
                id="confirmPassword" 
                v-model="form.confirmPassword" 
                :placeholder="$t('auth.confirmPasswordPlaceholder')"
                :feedback="false"
                toggleMask
                fluid
              />
            </div>
            <Button 
              type="submit" 
              :label="$t('auth.register')" 
              icon="pi pi-user-plus" 
              :loading="authStore.loading"
              class="mt-2"
            />
          </form>
          <Divider align="center">
            <span class="text-surface-400">{{ $t('auth.or') }}</span>
          </Divider>
          <div class="text-center">
            <router-link to="/login" class="text-primary hover:underline">
              {{ $t('auth.hasAccount') }}
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
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  if (!form.value.first_name || !form.value.last_name || !form.value.email || !form.value.password) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Please fill in all fields', life: 3000 })
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Passwords do not match', life: 3000 })
    return
  }

  if (form.value.password.length < 6) {
    toast.add({ severity: 'warn', summary: 'Warning', detail: 'Password must be at least 6 characters', life: 3000 })
    return
  }

  try {
    await authStore.register({
      first_name: form.value.first_name,
      last_name: form.value.last_name,
      email: form.value.email,
      password: form.value.password
    })
    toast.add({ severity: 'success', summary: 'Success', detail: 'Registration successful. Please login.', life: 3000 })
    router.push('/login')
  } catch (error) {
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: error.response?.data?.message || 'Registration failed', 
      life: 3000 
    })
  }
}
</script>
