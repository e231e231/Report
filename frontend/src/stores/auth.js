import { defineStore } from 'pinia';
import authService from '@/services/authService';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

    getters: {
      isAdmin: (state) => state.user?.role === 0,
      isEmployee: (state) => state.user?.role === 1,
      userColor: (state) => state.user?.color || '#000000',
      userName: (state) => state.user?.employeeName || '',
      employeeId: (state) => state.user?.id || '',
      employeeName: (state) => state.user?.employeeName || '',
      role: (state) => state.user?.role
    },

  actions: {
    /**
     * ログイン
     */
    async login(userName, password) {
      this.loading = true;
      this.error = null;

      try {
        const response = await authService.login(userName, password);
        this.user = response.data;
        this.isAuthenticated = true;
        return response;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * ログアウト
     */
    async logout() {
      this.loading = true;

      try {
        await authService.logout();
      } catch (error) {
        console.error('Logout error:', error);
      } finally {
        this.user = null;
        this.isAuthenticated = false;
        this.loading = false;
      }
    },

    /**
     * セッション確認
     */
    async checkSession() {
      try {
        const response = await authService.checkSession();
        if (response.authenticated) {
          this.user = response.data;
          this.isAuthenticated = true;
        } else {
          this.user = null;
          this.isAuthenticated = false;
        }
        return response.authenticated;
      } catch (error) {
        this.user = null;
        this.isAuthenticated = false;
        return false;
      }
    },

    /**
     * パスワード変更
     */
    async changePassword(newPassword, confirmPassword) {
      this.loading = true;
      this.error = null;

      try {
        await authService.changePassword(newPassword, confirmPassword);
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * ユーザー情報更新
     */
    updateUser(userData) {
      this.user = { ...this.user, ...userData };
    }
  }
});
