import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    nextId: 1
  }),

  actions: {
    /**
     * 通知を追加
     * @param {object} notification - 通知オブジェクト
     */
    addNotification({ type = 'info', message, duration = 5000 }) {
      const id = this.nextId++;
      const notification = {
        id,
        type, // success, error, warning, info
        message,
        timestamp: new Date()
      };

      this.notifications.push(notification);

      // 自動削除
      if (duration > 0) {
        setTimeout(() => {
          this.removeNotification(id);
        }, duration);
      }

      return id;
    },

    /**
     * 成功通知
     */
    success(message, duration) {
      return this.addNotification({ type: 'success', message, duration });
    },

    /**
     * エラー通知
     */
    error(message, duration = 7000) {
      return this.addNotification({ type: 'error', message, duration });
    },

    /**
     * 警告通知
     */
    warning(message, duration) {
      return this.addNotification({ type: 'warning', message, duration });
    },

    /**
     * 情報通知
     */
    info(message, duration) {
      return this.addNotification({ type: 'info', message, duration });
    },

    /**
     * 通知を削除
     */
    removeNotification(id) {
      const index = this.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },

    /**
     * すべての通知をクリア
     */
    clearAll() {
      this.notifications = [];
    }
  }
});
