<template>
  <div class="symptoms-tab">
    <!-- Boutons de contrôle -->
    <tab-control-buttons
      :has-selection="selectedRow !== null"
      @create="handleCreate"
      @update="handleUpdate"
      @delete="handleDelete"
      @import="handleImport"
      @export="handleExport"
      @refresh="handleRefresh"
    />
    <!-- Tableau des symptômes -->
    <div class="tab-symptom-table">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th class="resizable">
                <div class="th-content">
                  <input type="checkbox" @change="toggleAllRows" v-model="selectAll" />
                  <div class="resize-handle" @mousedown="startResize($event, 0)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('id')" class="sortable">
                    {{ $t('symptomsTable.headers.id') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'id'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 1)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('createdDate')" class="sortable">
                    {{ $t('symptomsTable.headers.createdDate') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'createdDate'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 2)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('updateDate')" class="sortable">
                    {{ $t('symptomsTable.headers.updateDate') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'updateDate'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 3)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('symptomCode')" class="sortable">
                    {{ $t('symptomsTable.headers.symptomCode') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'symptomCode'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 4)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('symptomLabel')" class="sortable">
                    {{ $t('symptomsTable.headers.symptomLabel') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'symptomLabel'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 5)"></div>
                </div>
              </th>
              <th class="resizable">
                <div class="th-content">
                  <div @click="sortBy('symptomLanguage')" class="sortable">
                    {{ $t('symptomsTable.headers.symptomLanguage') }}
                    <span class="sort-icon">
                      <template v-if="sortColumn === 'symptomLanguage'">
                        {{ sortDirection === 'asc' ? '▲' : '▼' }}
                      </template>
                      <template v-else>▲▼</template>
                    </span>
                  </div>
                  <div class="resize-handle" @mousedown="startResize($event, 6)"></div>
                </div>
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
                    <span v-if="filters.symptomLanguages.length === 0">All</span>
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
          <transition-group name="list" tag="tbody">
            <tr v-for="row in paginatedData" 
                :key="row.id" 
                @click="toggleRowSelection(row)"
                :class="{ 'selected-row': row.selected }"
                style="cursor: pointer;">
              <td @click.stop><input type="checkbox" v-model="row.selected" /></td>
              <td :title="row.id" @contextmenu.prevent="showCopyIcon($event, row.id)">...{{ row.id.slice(-5) }}</td>
              <td @contextmenu.prevent="showCopyIcon($event, row.createdDate)">{{ row.createdDate }}</td>
              <td @contextmenu.prevent="showCopyIcon($event, row.updateDate)">{{ row.updateDate }}</td>
              <td @contextmenu.prevent="showCopyIcon($event, row.symptomCode)">{{ row.symptomCode }}</td>
              <td @contextmenu.prevent="showCopyIcon($event, row.symptomLabel)">{{ row.symptomLabel }}</td>
              <td @contextmenu.prevent="showCopyIcon($event, row.symptomLanguage)">{{ row.symptomLanguage }}</td>
            </tr>
          </transition-group>
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
  <div class="copy-icon" v-if="showCopyIconAt" :style="copyIconStyle" @click="copyToClipboard" :class="{ 'fade-out': isFading }">
    <i class="fas fa-copy"></i>
  </div>
</template>

<script>
import { API_BASE_URL } from '@/config/config'
import TabControlButtons from '@/components/common/tabControlButtons.vue'

export default {
  name: 'SymptomsTab',
  components: {
    TabControlButtons
  },
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
      showCopyIconAt: null,
      copyContent: '',
      copyIconStyle: {
        position: 'fixed',
        left: '0px',
        top: '0px',
        display: 'none'
      },
      isFading: false,
      hideTimeout: null,
      columnWidths: [100, 150, 150, 150, 150, 200, 100]
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
        const response = await fetch(`${API_BASE_URL}/symptoms`, {
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
    showCopyIcon(event, content) {
      // Nettoyer le timeout précédent si il existe
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      
      this.isFading = false;
      event.preventDefault();
      this.copyContent = content;
      this.copyIconStyle = {
        position: 'fixed',
        left: event.clientX + 'px',
        top: event.clientY + 'px',
        display: 'block',
        backgroundColor: '#fff',
        padding: '8px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        zIndex: 1000
      };
      this.showCopyIconAt = { x: event.clientX, y: event.clientY };

      // Masquer l'icône après un clic ailleurs dans la page
      const hideIcon = () => {
        this.hideIconWithFade();
        document.removeEventListener('click', hideIcon);
      };
      setTimeout(() => {
        document.addEventListener('click', hideIcon);
      }, 0);

      // Masquer l'icône après 3 secondes avec animation
      this.hideTimeout = setTimeout(() => {
        this.hideIconWithFade();
      }, 3000);
    },

    hideIconWithFade() {
      this.isFading = true;
      setTimeout(() => {
        this.showCopyIconAt = null;
        this.copyIconStyle.display = 'none';
        this.isFading = false;
      }, 500); // Durée de l'animation
    },

    async copyToClipboard() {
      try {
        await navigator.clipboard.writeText(this.copyContent);
        this.hideIconWithFade();
      } catch (err) {
        console.error('Erreur lors de la copie:', err);
      }
    },
    startResize(event, columnIndex) {
      const table = event.target.closest('table');
      const column = table.querySelectorAll('th')[columnIndex];
      const startX = event.clientX;
      const startWidth = column.offsetWidth;

      const mouseMoveHandler = (event) => {
        const newWidth = startWidth + (event.clientX - startX);
        column.style.width = `${newWidth}px`;
        this.columnWidths[columnIndex] = newWidth;
      };

      const mouseUpHandler = () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    },
    initializeColumnWidths() {
      const table = this.$el.querySelector('table');
      const headers = table.querySelectorAll('th');
      headers.forEach((header, index) => {
        if (this.columnWidths[index]) {
          header.style.width = `${this.columnWidths[index]}px`;
        }
      });
    },
    toggleRowSelection(row) {
      row.selected = !row.selected;
    },
  },
  async mounted() {
    await this.handleRefresh();
    this.initializeColumnWidths();
  }
}
</script>

<style scoped>
@import '@/assets/styles/symptoms-tab.css';

.selected-row {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>