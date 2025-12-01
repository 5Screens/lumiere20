<template>
  <div class="flex flex-col items-center justify-center h-full gap-8">
    <h1 class="text-4xl font-bold text-primary">Lumiere V2</h1>
    <p class="text-xl text-surface-600">Frontend PrimeVue + Tailwind CSS</p>
    
    <div class="flex gap-4">
      <router-link to="/configuration-items">
        <Button label="Configuration Items" icon="pi pi-cog" size="large" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button'
</script>
