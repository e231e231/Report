<template>
  <div class="notification-container">
    <transition-group name="notification">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['alert', `alert-${getAlertType(notification.type)}`, 'notification-item']"
        role="alert"
      >
        <button
          type="button"
          class="btn-close"
          @click="removeNotification(notification.id)"
        ></button>
        {{ notification.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useNotificationStore } from '@/stores/notification';

const notificationStore = useNotificationStore();
const notifications = computed(() => notificationStore.notifications);

const getAlertType = (type) => {
  const typeMap = {
    success: 'success',
    error: 'danger',
    warning: 'warning',
    info: 'info'
  };
  return typeMap[type] || 'info';
};

const removeNotification = (id) => {
  notificationStore.removeNotification(id);
};
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 9998;
  max-width: 400px;
}

.notification-item {
  margin-bottom: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  position: relative;
  padding-right: 40px;
}

.btn-close {
  position: absolute;
  top: 10px;
  right: 10px;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100px);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100px);
}
</style>
