<template>
  <div class="symptoms-tab">
    <!-- Boutons de contrôle -->
    <div class="tab-symptom-button">
      <button class="control-button create" @click="handleCreate">Create</button>
      <button class="control-button refresh" @click="handleRefresh">Refresh</button>
      <button class="control-button update" @click="handleUpdate">Update</button>
      <button class="control-button delete" @click="handleDelete">Delete</button>
    </div>

    <!-- Tableau des symptômes -->
    <div class="tab-symptom-table">
      <table>
        <thead>
          <tr>
            <th><input type="checkbox" @change="toggleAllRows" v-model="selectAll" /></th>
            <th>
              <div class="header-content">
                Id
                <input type="text" v-model="filters.id" placeholder="Filter Id..." class="column-filter" />
              </div>
            </th>
            <th>
              <div class="header-content">
                Created date
                <input type="date" v-model="filters.createdDate" class="column-filter" />
              </div>
            </th>
            <th>
              <div class="header-content">
                Update date
                <input type="date" v-model="filters.updateDate" class="column-filter" />
              </div>
            </th>
            <th>
              <div class="header-content">
                Symptom Code
                <input type="text" v-model="filters.symptomCode" placeholder="Filter Code..." class="column-filter" />
              </div>
            </th>
            <th>
              <div class="header-content">
                Symptom label
                <input type="text" v-model="filters.symptomLabel" placeholder="Filter Label..." class="column-filter" />
              </div>
            </th>
            <th>
              <div class="header-content">
                Symptom language
                <input type="text" v-model="filters.symptomLanguage" placeholder="Filter Language..." class="column-filter" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginatedData" :key="row.id">
            <td><input type="checkbox" v-model="row.selected" /></td>
            <td>{{ row.id }}</td>
            <td>{{ row.createdDate }}</td>
            <td>{{ row.updateDate }}</td>
            <td>{{ row.symptomCode }}</td>
            <td>{{ row.symptomLabel }}</td>
            <td>{{ row.symptomLanguage }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination">
        <button @click="previousPage" :disabled="currentPage === 1">&lt;</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SymptomsTab',
  data() {
    return {
      selectAll: false,
      currentPage: 1,
      itemsPerPage: 10,
      filters: {
        id: '',
        createdDate: '',
        updateDate: '',
        symptomCode: '',
        symptomLabel: '',
        symptomLanguage: ''
      },
      symptoms: [] // Les données seront chargées depuis l'API
    }
  },
  computed: {
    filteredData() {
      return this.symptoms.filter(item => {
        return (
          (!this.filters.id || item.id.toLowerCase().includes(this.filters.id.toLowerCase())) &&
          (!this.filters.createdDate || item.createdDate.includes(this.filters.createdDate)) &&
          (!this.filters.updateDate || item.updateDate.includes(this.filters.updateDate)) &&
          (!this.filters.symptomCode || item.symptomCode.toLowerCase().includes(this.filters.symptomCode.toLowerCase())) &&
          (!this.filters.symptomLabel || item.symptomLabel.toLowerCase().includes(this.filters.symptomLabel.toLowerCase())) &&
          (!this.filters.symptomLanguage || item.symptomLanguage.toLowerCase().includes(this.filters.symptomLanguage.toLowerCase()))
        )
      })
    },
    paginatedData() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.filteredData.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredData.length / this.itemsPerPage)
    }
  },
  methods: {
    async getAllSymptomsFromServer() {
      try {
        const response = await fetch('http://localhost:3000/api/v1/symptoms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Erreur lors de la récupération des symptômes:', error);
        return [];
      }
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toISOString().split('T')[0]
    },
    toggleAllRows() {
      this.symptoms = this.symptoms.map(row => ({
        ...row,
        selected: this.selectAll
      }))
    },
    handleCreate() {
      // À implémenter
    },
    async handleRefresh() {
      try {
        console.log('[handleRefresh] Début du rafraîchissement des symptômes');
        
        // Réinitialisation du tableau symptoms
        this.symptoms = [];
        
        // Récupération des données
        const response = await this.getAllSymptomsFromServer();
        console.log('[handleRefresh] Réponse reçue du serveur:', response);

        if (response && response.success && Array.isArray(response.data)) {
          console.log(`[handleRefresh] ${response.data.length} symptômes trouvés`);
          
          // Transformation et alimentation du tableau symptoms
          this.symptoms = response.data.map(symptom => ({
            selected: false,
            id: symptom.uuid,
            createdDate: new Date(symptom.date_creation).toLocaleString(),
            updateDate: symptom.date_modification ? new Date(symptom.date_modification).toLocaleString() : '-',
            symptomCode: symptom.symptom_code,
            symptomLabel: symptom.libelle,
            symptomLanguage: symptom.langue
          }));

          // Réinitialisation de la pagination
          this.currentPage = 1;
          this.selectAll = false;
          
          console.log('[handleRefresh] Mise à jour des symptômes terminée avec succès');
        } else {
          console.error('[handleRefresh] Format de réponse invalide:', response);
          throw new Error('Format de réponse invalide');
        }
      } catch (error) {
        console.error('[handleRefresh] Erreur lors du rafraîchissement des symptômes:', error);
        this.symptoms = [];
      }
    },
    handleUpdate() {
      // À implémenter
    },
    handleDelete() {
      // À implémenter
    },
    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    }
  }
}
</script>

<style scoped>
.symptoms-tab {
  padding: 20px;
}

.tab-symptom-button {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.control-button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-button:hover {
  background-color: #f0f0f0;
}

.tab-symptom-table {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #ddd;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-filter {
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100%;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.pagination button {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
}

tr:hover {
  background-color: #f5f5f5;
}
</style>
