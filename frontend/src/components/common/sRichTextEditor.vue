<template>
  <div class="s-rich-text-editor">
    <!-- Label container -->
    <div class="s-rich-text-editor__label-container" v-if="label">
      <label class="s-rich-text-editor__label" :class="{ 's-rich-text-editor__label--required': required }">
        {{ label }}
      </label>
    </div>

    <!-- Toolbar -->
    <div class="editor-toolbar">
      <!-- Text format group -->
      <div class="toolbar-group">
        <select class="toolbar-select" @change="formatBlock($event.target.value)">
          <option value="p" class="format-option format-p">Normal</option>
          <option value="h1" class="format-option format-h1">Titre 1</option>
          <option value="h2" class="format-option format-h2">Titre 2</option>
          <option value="h3" class="format-option format-h3">Titre 3</option>
          <option value="h4" class="format-option format-h4">Titre 4</option>
        </select>
      </div>

      <!-- Text style group -->
      <div class="toolbar-group">
        <button class="toolbar-button" @click="execCommand('bold')" title="Gras">
          <i class="fas fa-bold"></i>
        </button>
        <button class="toolbar-button" @click="execCommand('italic')" title="Italique">
          <i class="fas fa-italic"></i>
        </button>
        <button class="toolbar-button" @click="execCommand('underline')" title="Souligné">
          <i class="fas fa-underline"></i>
        </button>
        <button class="toolbar-button" @click="execCommand('strikeThrough')" title="Barré">
          <i class="fas fa-strikethrough"></i>
        </button>
      </div>

      <!-- Color picker -->
      <div class="toolbar-group">
        <div class="toolbar-button-container" ref="colorPickerGroupRef">
          <button class="toolbar-button" @click="toggleColorPicker($event)" title="Couleur du texte">
            <i class="fas fa-palette"></i>
          </button>
          <div v-if="showColorPicker" class="color-picker" ref="colorPickerRef" :style="popupPosition">
            <div 
              v-for="color in colors" 
              :key="color" 
              class="color-option" 
              :style="{ backgroundColor: color }"
              @click="applyColor(color)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Lists group -->
      <div class="toolbar-group">
        <button class="toolbar-button" @click="execCommand('insertUnorderedList')" title="Liste à puces">
          <i class="fas fa-list-ul"></i>
        </button>
        <button class="toolbar-button" @click="execCommand('insertOrderedList')" title="Liste numérotée">
          <i class="fas fa-list-ol"></i>
        </button>
      </div>

      <!-- Insert group -->
      <div class="toolbar-group">
        <div class="toolbar-button-container" ref="linkDialogGroupRef">
          <button class="toolbar-button" @click="toggleLinkDialog($event)" title="Insérer un lien">
            <i class="fas fa-link"></i>
          </button>
          <!-- Link Dialog -->
          <div v-if="showLinkDialog" class="link-dialog" ref="linkDialogRef" :style="popupPosition">
            <input 
              type="text" 
              v-model="linkUrl" 
              placeholder="URL (https://...)" 
              @keyup.enter="insertLink"
            >
            <input 
              type="text" 
              v-model="linkText" 
              placeholder="Texte du lien" 
              @keyup.enter="insertLink"
            >
            <button @click="insertLink">Insérer</button>
            <button class="cancel" @click="showLinkDialog = false">Annuler</button>
          </div>
        </div>
        <div class="toolbar-button-container" ref="emojiPickerGroupRef">
          <button class="toolbar-button" @click="toggleEmojiPicker($event)" title="Insérer un emoji">
            <i class="fas fa-smile"></i>
          </button>
          <!-- Emoji Picker -->
          <div v-if="showEmojiPicker" class="emoji-picker" ref="emojiPickerRef" :style="popupPosition">
            <div 
              v-for="emoji in emojis" 
              :key="emoji" 
              class="emoji-option" 
              @click="insertEmoji(emoji)"
            >
              {{ emoji }}
            </div>
          </div>
        </div>
        <div class="toolbar-button-container" ref="tableDialogGroupRef">
          <button class="toolbar-button" @click="showTableDialog = true; setPopupPosition($event)" title="Insérer un tableau">
            <i class="fas fa-table"></i>
          </button>
          <!-- Table Dialog -->
          <div v-if="showTableDialog" class="table-dialog" ref="tableDialogRef" :style="popupPosition">
            <input 
              type="number" 
              v-model="tableRows" 
              min="1" 
              max="10" 
              placeholder="Nombre de lignes"
            >
            <input 
              type="number" 
              v-model="tableCols" 
              min="1" 
              max="10" 
              placeholder="Nombre de colonnes"
            >
            <button @click="insertTable">Insérer</button>
            <button class="cancel" @click="showTableDialog = false">Annuler</button>
          </div>
        </div>
        <button class="toolbar-button" @click="insertCodeSnippet" title="Insérer un extrait de code">
          <i class="fas fa-code"></i>
        </button>
        <input 
          type="file" 
          ref="imageInput" 
          accept="image/*" 
          style="display: none" 
          @change="insertImage"
        >
        <button class="toolbar-button" @click="$refs.imageInput.click()" title="Insérer une image">
          <i class="fas fa-image"></i>
        </button>
      </div>
    </div>

    <!-- Editor content -->
    <div 
      class="editor-content" 
      ref="editorContent" 
      contenteditable="true"
      @input="updateContent"
      @paste="handlePaste"
      @click="handleContentClick"
    ></div>

    <!-- Table Actions -->
    <div class="toolbar-button-container" ref="tableActionsGroupRef">
      <div v-if="showTableActions" class="table-actions" :style="tableActionsPosition" ref="tableActionsRef">
        <button class="table-action-button" @click="deleteTable" title="Supprimer le tableau">
          <i class="fas fa-trash"></i>
        </button>
        <button class="table-action-button" @click="copyTable" title="Copier le tableau">
          <i class="fas fa-copy"></i>
        </button>
        <button class="table-action-button" @click="alignTable('left')" title="Aligner à gauche">
          <i class="fas fa-align-left"></i>
        </button>
        <button class="table-action-button" @click="alignTable('center')" title="Centrer">
          <i class="fas fa-align-center"></i>
        </button>
        <button class="table-action-button" @click="alignTable('right')" title="Aligner à droite">
          <i class="fas fa-align-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineProps, defineEmits } from 'vue';
import '../../assets/styles/sRichTextEditor.css';

// Props and emits
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Commencez à écrire...'
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  edition: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue']);

// Refs
const editorContent = ref(null);
const colorPickerRef = ref(null);
const emojiPickerRef = ref(null);
const linkDialogRef = ref(null);
const tableDialogRef = ref(null);
const tableActionsRef = ref(null);
const imageInput = ref(null);
const colorPickerGroupRef = ref(null);
const linkDialogGroupRef = ref(null);
const emojiPickerGroupRef = ref(null);
const tableDialogGroupRef = ref(null);
const tableActionsGroupRef = ref(null);

// State variables
const showColorPicker = ref(false);
const showEmojiPicker = ref(false);
const showLinkDialog = ref(false);
const showTableDialog = ref(false);
const showTableActions = ref(false);
const tableActionsPosition = ref({ top: '0px', left: '0px' });
const popupPosition = ref({ top: '0px', left: '0px' });
const linkUrl = ref('');
const linkText = ref('');
const tableRows = ref(3);
const tableCols = ref(3);
const currentTable = ref(null);

// Variable pour stocker la sélection
let savedSelection = null;

// Fonction pour mémoriser la sélection
const saveSelection = () => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    savedSelection = sel.getRangeAt(0);
  }
};

// Fonction pour restaurer la sélection
const restoreSelection = () => {
  if (savedSelection) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(savedSelection);
  }
};

// Colors for the color picker
const colors = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'
];

// Emojis for the emoji picker
const emojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍',
  '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '👍', '👎', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘', '👌', '👈', '👉'
];

// Initialize editor
onMounted(() => {
  if (props.modelValue) {
    editorContent.value.innerHTML = props.modelValue;
  } else {
    editorContent.value.innerHTML = `<p>${props.placeholder}</p>`;
    editorContent.value.addEventListener('focus', () => {
      if (editorContent.value.innerHTML === `<p>${props.placeholder}</p>`) {
        editorContent.value.innerHTML = '<p></p>';
      }
    });
  }

  // Add click event listener to document to close dropdowns when clicking outside
  document.addEventListener('click', handleClickOutside);
});

// Cleanup event listeners
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch for model value changes
watch(() => props.modelValue, (newVal) => {
  if (newVal !== editorContent.value.innerHTML) {
    editorContent.value.innerHTML = newVal || `<p>${props.placeholder}</p>`;
  }
});

// Update content and emit changes
const updateContent = () => {
  emit('update:modelValue', editorContent.value.innerHTML);
};

// Execute document.execCommand for basic formatting
const execCommand = (command, value = null) => {
  document.execCommand(command, false, value);
  updateContent();
};

// Format block (headings, paragraph)
const formatBlock = (block) => {
  execCommand('formatBlock', block);
};

// Toggle color picker
const toggleColorPicker = (event) => {
  saveSelection();
  showColorPicker.value = !showColorPicker.value;
  
  // Close other popups
  if (showColorPicker.value) {
    showLinkDialog.value = false;
    showTableDialog.value = false;
    showEmojiPicker.value = false;
    setPopupPosition(event);
  }
};

// Toggle emoji picker
const toggleEmojiPicker = (event) => {
  saveSelection();
  showEmojiPicker.value = !showEmojiPicker.value;
  
  // Close other popups
  if (showEmojiPicker.value) {
    showColorPicker.value = false;
    showLinkDialog.value = false;
    showTableDialog.value = false;
    setPopupPosition(event);
  }
};

// Toggle link dialog
const toggleLinkDialog = (event) => {
  saveSelection();
  showLinkDialog.value = !showLinkDialog.value;
  
  if (showLinkDialog.value) {
    // Get selected text for link
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection.toString().length > 0) {
        linkText.value = selection.toString();
      } else {
        linkText.value = '';
      }
    }
    
    // Close other popups
    showColorPicker.value = false;
    showEmojiPicker.value = false;
    showTableDialog.value = false;
    setPopupPosition(event);
  }
};

// Apply color to text
const applyColor = (color) => {
  restoreSelection();
  execCommand('foreColor', color);
  showColorPicker.value = false;
};

// Insert emoji
const insertEmoji = (emoji) => {
  restoreSelection();
  execCommand('insertText', emoji);
  showEmojiPicker.value = false;
};

// Insert link
const insertLink = () => {
  restoreSelection();
  if (linkUrl.value) {
    const url = linkUrl.value.startsWith('http') ? linkUrl.value : `https://${linkUrl.value}`;
    const text = linkText.value || url;
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.textContent = text;
    link.target = '_blank';
    link.classList.add('s-attachment-link'); // Ajout de la classe pour l'icône de pièce jointe
    
    // Insert the link at the current selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(link);
      
      // Move cursor to the end of the link
      range.setStartAfter(link);
      range.setEndAfter(link);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      editorContent.value.appendChild(link);
    }
    
    // Reset and close dialog
    linkUrl.value = '';
    linkText.value = '';
    showLinkDialog.value = false;
    updateContent();
  }
};

// Insert table
const insertTable = () => {
  const rows = tableRows.value || 3;
  const cols = tableCols.value || 3;
  
  let tableHTML = '<table>';
  
  // Create header row
  tableHTML += '<tr>';
  for (let j = 0; j < cols; j++) {
    tableHTML += '<th></th>';
  }
  tableHTML += '</tr>';
  
  // Create data rows
  for (let i = 1; i < rows; i++) {
    tableHTML += '<tr>';
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td></td>';
    }
    tableHTML += '</tr>';
  }
  
  tableHTML += '</table>';
  
  execCommand('insertHTML', tableHTML);
  showTableDialog.value = false;
  tableRows.value = 3;
  tableCols.value = 3;
};

// Handle content click to detect tables
const handleContentClick = (event) => {
  // Check if clicked on a table
  let target = event.target;
  while (target && target !== editorContent.value) {
    if (target.tagName === 'TABLE') {
      currentTable.value = target;
      showTableActions.value = true;
      
      // Position the table actions menu below the table
      const rect = target.getBoundingClientRect();
      const editorRect = editorContent.value.getBoundingClientRect();
      
      tableActionsPosition.value = {
        top: `${rect.top - editorRect.top - 40}px`,
        left: `${rect.left - editorRect.left}px`
      };
      
      return;
    }
    target = target.parentElement;
  }
  
  // If not clicking on a table, hide table actions
  if (showTableActions.value && !event.target.closest('.table-actions')) {
    showTableActions.value = false;
  }
};

// Delete table
const deleteTable = () => {
  if (currentTable.value) {
    currentTable.value.remove();
    showTableActions.value = false;
    updateContent();
  }
};

// Copy table
const copyTable = () => {
  if (currentTable.value) {
    const range = document.createRange();
    range.selectNode(currentTable.value);
    
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    document.execCommand('copy');
    selection.removeAllRanges();
  }
};

// Align table
const alignTable = (alignment) => {
  if (currentTable.value) {
    currentTable.value.style.margin = alignment === 'center' ? '0 auto' : '';
    currentTable.value.style.float = alignment === 'left' || alignment === 'right' ? alignment : '';
    updateContent();
  }
};

// Insert code snippet
const insertCodeSnippet = () => {
  const codeHTML = '<pre><code>// Your code here</code></pre>';
  execCommand('insertHTML', codeHTML);
  
  // Focus inside the code block
  nextTick(() => {
    const codeBlock = editorContent.value.querySelector('pre code');
    if (codeBlock) {
      const range = document.createRange();
      range.setStart(codeBlock, 0);
      range.collapse(true);
      
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  });
};

// Insert image
const insertImage = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '600px';
      
      // Insert the image at the current selection
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(img);
        
        // Move cursor to the end of the image
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        editorContent.value.appendChild(img);
      }
      
      updateContent();
    };
    reader.readAsDataURL(file);
    
    // Reset file input
    event.target.value = '';
  }
};

// Handle paste event for images
const handlePaste = (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  
  for (const item of items) {
    if (item.type.indexOf('image') === 0) {
      event.preventDefault();
      
      const blob = item.getAsFile();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.maxWidth = '400px';
        
        // Insert the image at the current selection
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(img);
          
          // Move cursor to the end of the image
          range.setStartAfter(img);
          range.setEndAfter(img);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          editorContent.value.appendChild(img);
        }
        
        updateContent();
      };
      
      reader.readAsDataURL(blob);
      return;
    }
  }
};

// Handle clicks outside of dropdowns to close them
const handleClickOutside = (event) => {
  // Color picker
  if (showColorPicker.value && 
      colorPickerRef.value && 
      !colorPickerRef.value.contains(event.target) && 
      !event.target.closest('.toolbar-button[title="Couleur du texte"]')) {
    showColorPicker.value = false;
  }
  
  // Emoji picker
  if (showEmojiPicker.value && 
      emojiPickerRef.value && 
      !emojiPickerRef.value.contains(event.target) && 
      !event.target.closest('.toolbar-button[title="Insérer un emoji"]')) {
    showEmojiPicker.value = false;
  }
  
  // Link dialog
  if (showLinkDialog.value && 
      linkDialogRef.value && 
      !linkDialogRef.value.contains(event.target) && 
      !event.target.closest('.toolbar-button[title="Insérer un lien"]')) {
    showLinkDialog.value = false;
  }
  
  // Table dialog
  if (showTableDialog.value && 
      tableDialogRef.value && 
      !tableDialogRef.value.contains(event.target) && 
      !event.target.closest('.toolbar-button[title="Insérer un tableau"]')) {
    showTableDialog.value = false;
  }
  
  // Table actions
  if (showTableActions.value && 
      tableActionsRef.value && 
      !tableActionsRef.value.contains(event.target) && 
      !event.target.closest('table') && 
      !event.target.closest('td') && 
      !event.target.closest('th')) {
    showTableActions.value = false;
  }
};

// Fonction pour positionner les popups
const setPopupPosition = (event) => {
  if (!event) return;
  
  const button = event.currentTarget;
  if (!button) return;
  
  popupPosition.value = {
    top: `${button.offsetHeight}px`,
    left: '0px'
  };
};

// Fonction pour positionner les actions de tableau
const setTableActionsPosition = (table) => {
  if (!table) return;
  
  const rect = table.getBoundingClientRect();
  const editorRect = editorContent.value.getBoundingClientRect();
  
  tableActionsPosition.value = {
    top: `${rect.top - editorRect.top - 40}px`,
    left: `${rect.left - editorRect.left}px`
  };
};
</script>
