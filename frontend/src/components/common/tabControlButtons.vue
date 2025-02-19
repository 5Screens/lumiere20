<template>
  <div class="tab-control-buttons">
    <div class="left-buttons">
      <button class="control-button create" @click="handleCreate">
        <i class="fas fa-plus"></i> 
      </button>
      <button class="control-button update" @click="handleUpdate" v-show="hasSelection">
        <i class="fas fa-edit"></i> 
      </button>
      <button class="control-button delete" @click="handleDelete" v-show="hasSelection">
        <i class="fas fa-trash"></i> 
      </button>
    </div>
    <div class="right-buttons">
      <button class="control-button import" @click="handleImport">
        <i class="fas fa-file-import"></i> 
      </button>
      <button class="control-button export" @click="handleExport">
        <i class="fas fa-file-export"></i> 
      </button>
      <button class="control-button refresh" @click="handleRefresh">
        <i class="fas fa-sync"></i> 
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TabControlButtons',
  props: {
    hasSelection: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleCreate() {
      this.$emit('create')
    },
    handleUpdate() {
      this.$emit('update')
    },
    handleDelete() {
      this.$emit('delete')
    },
    handleImport() {
      this.$emit('import')
    },
    handleExport() {
      this.$emit('export')
    },
    handleRefresh() {
      this.$emit('refresh')
    }
  }
}
</script>
<style scoped>
@import "@/assets/styles/tabControlButtons.css";
</style>
