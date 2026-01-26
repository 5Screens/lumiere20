<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-50">
    <div class="w-full max-w-md p-8">
      <!-- Session expired message -->
      <Message v-if="sessionExpired" severity="warn" :closable="false" class="mb-4">
        <template #icon>
          <i class="pi pi-clock text-xl"></i>
        </template>
        <div class="flex flex-col gap-1">
          <span class="font-semibold">{{ $t('auth.sessionExpired') }}</span>
          <span class="text-sm">{{ $t('auth.sessionExpiredMessage') }}</span>
        </div>
      </Message>
      
      <Card>
        <template #title>
          <div class="text-center">
            <h1 class="text-2xl font-bold text-primary">Lumiere</h1>
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
    <Toast position="bottom-right" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import Message from 'primevue/message'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const authStore = useAuthStore()

const sessionExpired = computed(() => route.query.sessionExpired === 'true')

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
