<script setup>
import ButtonStandard from '@/components/ButtonStandard.vue'

const demoPayload = {
  ticket_type_code: "TASK",
  ticket_status_code: "NEW",
  title: "Configurer le serveur de production",
  description: "Installation et configuration du serveur web pour l'environnement de production",
  writer_uuid: "efd1c5ce-8ab0-446a-95cd-c8262217dff0",
  requested_by_uuid: "feabfba9-884b-4fe2-88ea-b53ca52cc10d",
  requested_for_uuid: "1e65c43e-da9e-4592-a3a9-bef1cf2d52e2"
}
</script>

<template>
  <section class="container">
    <h1>Hello world</h1>
    <p class="description">
      POC : création d'un ticket via l'API Lumière.
    </p>
    <p class="info">
      Ce bouton appelle <code>POST /api/v1/tickets</code> avec un payload de démonstration.
    </p>
    <ButtonStandard :demoPayload="demoPayload" />
  </section>
</template>

<style scoped>
.container {
  max-width: 720px;
  margin: 40px auto;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 32px;
  font-weight: 700;
  color: #111;
  margin-bottom: 16px;
}

.description {
  font-size: 18px;
  color: #555;
  margin-bottom: 12px;
}

.info {
  font-size: 14px;
  color: #777;
  margin-bottom: 24px;
}

code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: #d63384;
}
</style>
