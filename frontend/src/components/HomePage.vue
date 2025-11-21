<template>
  <div class="home-page">
    <div class="welcome-message">
      <div class="welcome-icon">
        <i class="fas fa-home"></i>
      </div>
      <h1>{{ $t('welcome.title') }}</h1>
      <p>{{ $t('welcome.subtitle') }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomePage'
}
</script>

<style scoped>
.home-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background: var(--bg-color);
}

.welcome-message {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  font-size: 4rem;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  opacity: 0.7;
}

.welcome-message h1 {
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.welcome-message p {
  font-size: 1.2rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
