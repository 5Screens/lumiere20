<template>
  <div id="app">
    <header class="header">
      <div class="left-section">
        <router-link to="/" class="home-icon">
          <i class="fas fa-home"></i>
          <span>My Work</span>
        </router-link>
        <button class="create-button">Create</button>
      </div>
      <div class="right-section">
        <div class="search-bar">
          <input type="text" placeholder="Search..." />
        </div>
        <button class="info-button">
          <i class="fas fa-info-circle"></i>
        </button>
        <button class="logout-button">
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>

    <div class="main-content">
      <nav class="side-menu">
        <ul>
          <li><router-link to="/service-hub">Service Hub</router-link></li>
          <li><router-link to="/sprint-center">Sprint Center</router-link></li>
          <li><router-link to="/mail">Mail</router-link></li>
          <li><router-link to="/portals-builder">Portals Builder</router-link></li>
          <li><router-link to="/data">Data</router-link></li>
          <li><router-link to="/tableaux">Tableaux</router-link></li>
          <li><router-link to="/configuration">Configuration</router-link></li>
          <li><router-link to="/administration">Administration</router-link></li>
        </ul>
      </nav>

      <main class="content-area">
        <router-view></router-view>
      </main>
    </div>

    <footer class="status-bar">
      <div class="status-info">
        <!-- Status information will be displayed here -->
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css');

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: Arial, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.left-section, .right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.home-icon {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #333;
}

.create-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.create-button:hover {
  background-color: #0056b3;
}

.search-bar input {
  padding: 0.5rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  width: 200px;
}

.info-button, .logout-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #6c757d;
  transition: color 0.3s;
}

.info-button:hover, .logout-button:hover {
  color: #343a40;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.side-menu {
  width: 250px;
  background-color: #f8f9fa;
  border-right: 1px solid #dee2e6;
  padding: 1rem;
}

.side-menu ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.side-menu li {
  margin-bottom: 0.5rem;
}

.side-menu a {
  display: block;
  padding: 0.5rem;
  color: #333;
  text-decoration: none;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.side-menu a:hover {
  background-color: #e9ecef;
}

.content-area {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.status-bar {
  padding: 0.5rem;
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  font-size: 0.875rem;
  color: #6c757d;
}
</style>
