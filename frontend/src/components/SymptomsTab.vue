<template>
  <div class="symptoms-tab">
    <!-- Boutons de contrôle -->
    <div class="tab-symptom-button">
      <div class="left-buttons">
        <button class="control-button create" @click="handleCreate">Create</button>
        <button class="control-button update" @click="handleUpdate">Update</button>
        <button class="control-button delete" @click="handleDelete">Delete</button>
      </div>
      <div class="right-buttons">
        <button class="control-button import" @click="handleImport" :title="$t('configuration.import')">
          <i class="fas fa-file-import"></i>
        </button>
        <button class="control-button export" @click="handleExport" :title="$t('configuration.export')">
          <i class="fas fa-file-export"></i>
        </button>
        <button class="control-button refresh" @click="handleRefresh" :title="$t('configuration.refresh')">
          <i class="fas fa-sync-alt"></i>
        </button>
      </div>
    </div>

    <!-- Tableau des symptômes -->
    <div class="tab-symptom-table">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" @change="toggleAllRows" v-model="selectAll" /></th>
              <th @click="sortBy('id')" class="sortable">
                {{ $t('symptomsTable.headers.id') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'id'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
              <th @click="sortBy('createdDate')" class="sortable">
                {{ $t('symptomsTable.headers.createdDate') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'createdDate'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
              <th @click="sortBy('updateDate')" class="sortable">
                {{ $t('symptomsTable.headers.updateDate') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'updateDate'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
              <th @click="sortBy('symptomCode')" class="sortable">
                {{ $t('symptomsTable.headers.symptomCode') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'symptomCode'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
              <th @click="sortBy('symptomLabel')" class="sortable">
                {{ $t('symptomsTable.headers.symptomLabel') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'symptomLabel'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
              <th @click="sortBy('symptomLanguage')" class="sortable">
                {{ $t('symptomsTable.headers.symptomLanguage') }}
                <span class="sort-icon">
                  <template v-if="sortColumn === 'symptomLanguage'">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>▲▼</template>
                </span>
              </th>
            </tr>
            <tr class="filter-row">
              <th></th>
              <th>
                <input type="text" v-model="filters.id" placeholder="Filter Id..." class="column-filter" />
              </th>
              <th>
                <input type="date" v-model="filters.createdDate" class="column-filter" />
              </th>
              <th>
                <input type="date" v-model="filters.updateDate" class="column-filter" />
              </th>
              <th>
                <input type="text" v-model="filters.symptomCode" placeholder="Filter Code..." class="column-filter" />
              </th>
              <th>
                <input type="text" v-model="filters.symptomLabel" placeholder="Filter Label..." class="column-filter" />
              </th>
              <th>
                <div class="custom-multiselect">
                  <div class="multiselect-header" @click="toggleLanguageDropdown">
                    <span v-if="filters.symptomLanguages.length === 0">Sélectionner les langues</span>
                    <span v-else>{{ filters.symptomLanguages.length }} langue(s) sélectionnée(s)</span>
                    <span class="dropdown-arrow">▼</span>
                  </div>
                  <div class="multiselect-dropdown" v-show="isLanguageDropdownOpen">
                    <div class="multiselect-option" v-for="lang in availableLanguages" :key="lang">
                      <label>
                        <input type="checkbox" 
                               :value="lang" 
                               v-model="filters.symptomLanguages">
                        {{ lang.toUpperCase() }}
                      </label>
                    </div>
                  </div>
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
      </div>

      <!-- Table footer -->
      <div class="table-footer">
        Total éléments trouvés : {{ filteredData.length }}
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button @click="previousPage" :disabled="currentPage === 1">&lt;</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">&gt;</button>
        <div class="items-per-page">
          <select v-model="itemsPerPage" @change="handleItemsPerPageChange">
            <option v-for="n in [5, 10, 20, 50, 100]" :key="n" :value="n">
              {{ n }} éléments
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SymptomsTab',
  data() {
    return {
      symptoms: [],
      selectAll: false,
      currentPage: 1,
      itemsPerPage: 10,
      isLanguageDropdownOpen: false,
      sortColumn: null,
      sortDirection: null,
      availableLanguages: ['fr', 'en', 'es', 'de', 'it'],
      filters: {
        id: '',
        createdDate: '',
        updateDate: '',
        symptomCode: '',
        symptomLabel: '',
        symptomLanguages: []
      },
    }
  },
  computed: {
    filteredData() {
      let data = [...this.symptoms];

      // Appliquer les filtres existants...
      if (this.filters.id) {
        data = data.filter(item => item.id.toLowerCase().includes(this.filters.id.toLowerCase()));
      }
      if (this.filters.createdDate) {
        data = data.filter(item => item.createdDate.includes(this.filters.createdDate));
      }
      if (this.filters.updateDate) {
        data = data.filter(item => item.updateDate.includes(this.filters.updateDate));
      }
      if (this.filters.symptomCode) {
        data = data.filter(item => item.symptomCode.toLowerCase().includes(this.filters.symptomCode.toLowerCase()));
      }
      if (this.filters.symptomLabel) {
        data = data.filter(item => item.symptomLabel.toLowerCase().includes(this.filters.symptomLabel.toLowerCase()));
      }
      if (this.filters.symptomLanguages.length > 0) {
        data = data.filter(item => this.filters.symptomLanguages.includes(item.symptomLanguage));
      }

      // Appliquer le tri si une colonne est sélectionnée
      if (this.sortColumn) {
        data.sort((a, b) => {
          let compareA = a[this.sortColumn];
          let compareB = b[this.sortColumn];

          // Convertir en minuscules pour les chaînes
          if (typeof compareA === 'string') {
            compareA = compareA.toLowerCase();
            compareB = compareB.toLowerCase();
          }

          if (compareA < compareB) return this.sortDirection === 'asc' ? -1 : 1;
          if (compareA > compareB) return this.sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return data;
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
    },
    toggleLanguageDropdown() {
      this.isLanguageDropdownOpen = !this.isLanguageDropdownOpen;
    },
    handleItemsPerPageChange() {
      this.currentPage = 1;
    },
    async handleImport() {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.csv';
        
        input.onchange = async (event) => {
          const file = event.target.files[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const content = e.target.result;
              let data;
              
              if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
              } else if (file.name.endsWith('.csv')) {
                // Implémentation de l'import CSV à faire
                alert('L\'import CSV sera bientôt disponible');
                return;
              }

              // TODO: Appeler l'API backend pour importer les données
              console.log('Données à importer:', data);
              await this.handleRefresh();
            } catch (error) {
              console.error('Erreur lors du traitement du fichier:', error);
              alert('Erreur lors du traitement du fichier. Veuillez vérifier le format.');
            }
          };
          reader.readAsText(file);
        };
        
        input.click();
      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        alert('Une erreur est survenue lors de l\'import.');
      }
    },

    /**
     * Exports the filtered data as a JSON file.
     * The file is named with a timestamp to ensure unique filenames.
     * If an error occurs during the export process, an error message is logged
     * and an alert is shown to the user.
     */
    async handleExport() {
      try {
        const data = this.filteredData;
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        a.href = url;
        a.download = `symptoms-export-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        alert('Une erreur est survenue lors de l\'export.');
      }
    },
    
    sortBy(column) {
      if (this.sortColumn === column) {
        // Si on clique sur la même colonne, on change la direction
        if (this.sortDirection === 'asc') {
          this.sortDirection = 'desc';
        } else if (this.sortDirection === 'desc') {
          // Si on était en desc, on réinitialise
          this.sortColumn = null;
          this.sortDirection = null;
        }
      } else {
        // Nouvelle colonne, on commence par asc
        this.sortColumn = column;
        this.sortDirection = 'asc';
      }
    },
  },
  async mounted() {
    await this.handleRefresh();
  }
}
</script>

<style scoped>
.symptoms-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
}

.tab-symptom-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.left-buttons, .right-buttons {
  display: flex;
  gap: 0.5rem;
}

.control-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-button.import {
  background-color: #4CAF50;
  color: white;
}

.control-button.export {
  background-color: #2196F3;
  color: white;
}

.control-button.refresh {
  background-color: #9C27B0;
  color: white;
}

.control-button i {
  font-size: 0.9rem;
}

.control-button.refresh i {
  transition: transform 0.3s ease-in-out;
}

.control-button.refresh:hover i {
  transform: rotate(180deg);
}

.tab-symptom-table {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  position: sticky;
  top: 0;
  background-color: var(--background-color);
  z-index: 1;
}

tbody {
  overflow-y: auto;
  height: 100%;
}

.table-container {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.table-footer {
  position: sticky;
  bottom: 0;
  background-color: var(--background-color);
  padding: 10px;
  border-top: 1px solid var(--border-color);
  z-index: 1;
}

.pagination {
  position: sticky;
  bottom: 0;
  background-color: var(--background-color);
  padding: 10px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  z-index: 1;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

th {
  background-color: #f8f9fa;
}

tr:nth-child(even) {
  background-color: #f8f9fa;
}

tr:hover {
  background-color: #f5f5f5;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.column-filter {
  width: 100%;
  padding: 4px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  margin-top: 4px;
  font-size: 14px;
}

select.column-filter {
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

select.column-filter:hover {
  border-color: #999;
}

select.column-filter:focus {
  outline: none;
  border-color: #666;
  box-shadow: 0 0 3px rgba(0,0,0,0.1);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.items-per-page {
  margin-left: 1rem;
}

.items-per-page select {
  padding: 0.25rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
}

.items-per-page select:hover {
  border-color: #666;
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

.custom-multiselect {
  position: relative;
  display: inline-block;
  width: 100%;
}

.multiselect-header {
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.multiselect-header:hover {
  background-color: #f0f0f0;
}

.dropdown-arrow {
  margin-left: 8px;
}

.multiselect-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  background-color: #fff;
  border: 1px solid #ddd;
  padding: 8px;
  z-index: 1;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.multiselect-option {
  padding: 4px;
  cursor: pointer;
}

.multiselect-option:hover {
  background-color: #f5f5f5;
}

.table-footer {
  padding: 10px;
  text-align: left;
  border-top: 1px solid #ddd;
}

.filter-row th {
  font-weight: normal;
  padding: 8px;
  background-color: #f8f9fa;
}

.filter-row input {
  width: 100%;
  padding: 4px 8px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.9em;
}

.filter-row input:focus {
  outline: none;
  border-color: #80bdff;
  box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
}

.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 20px;
}

.sortable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.sort-icon {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.5;
  font-size: 0.8em;
}

.sortable:hover .sort-icon {
  opacity: 0.8;
}

th[class="sortable"] .sort-icon template:last-child {
  opacity: 0.3;
}
</style>
