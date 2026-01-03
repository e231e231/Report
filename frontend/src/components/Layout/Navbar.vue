<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container-fluid">
      <router-link class="navbar-brand" to="/">
        {{ appTitle }}
      </router-link>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/daily-reports">
              日報一覧
            </router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/daily-reports/new">
              日報登録
            </router-link>
          </li>

          <li v-if="!authStore.isAdmin" class="nav-item">
            <router-link class="nav-link" to="/mentions">
              メンション
            </router-link>
          </li>

          <li class="nav-item">
            <router-link class="nav-link" to="/information">
              お知らせ
            </router-link>
          </li>

          <li v-if="authStore.isAdmin" class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              role="button"
              data-bs-toggle="dropdown"
            >
              管理機能
            </a>
            <ul class="dropdown-menu">
              <li>
                <router-link class="dropdown-item" to="/employees">
                  従業員管理
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/information/new">
                  お知らせ登録
                </router-link>
              </li>
              <li>
                <router-link class="dropdown-item" to="/admin/search">
                  日報検索
                </router-link>
              </li>
            </ul>
          </li>
        </ul>

        <ul class="navbar-nav">
          <li class="nav-item">
            <span class="nav-link">
              <span
                class="user-color-indicator"
                :style="{ backgroundColor: authStore.userColor }"
              ></span>
              {{ authStore.userName }}
            </span>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/profile">
              設定
            </router-link>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#" @click.prevent="handleLogout">
              ログアウト
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const appTitle = process.env.VUE_APP_TITLE || '日報管理システム';

const handleLogout = async () => {
  try {
    await authStore.logout();
    notificationStore.success('ログアウトしました');
    router.push('/login');
  } catch (error) {
    notificationStore.error('ログアウトに失敗しました');
  }
};
</script>

<style scoped lang="scss">
.navbar {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.user-color-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
  border: 1px solid rgba(255,255,255,0.3);
}
</style>
