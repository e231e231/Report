<template>
  <div v-if="show" class="loading-overlay">
    <div class="spinner-border text-primary" role="status">
      <span class="visually-hidden">読み込み中...</span>
    </div>
    <p v-if="message" class="mt-3">{{ message }}</p>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    default: ''
  }
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
</style>
