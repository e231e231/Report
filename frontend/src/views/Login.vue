<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h2>{{ appTitle }}</h2>
        <p class="text-muted">日報管理システムへようこそ</p>
      </div>

      <form @submit.prevent="handleLogin">
        <div class="mb-3">
          <label for="userName" class="form-label">ユーザー名</label>
          <input
            id="userName"
            v-model="loginForm.userName"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors.userName }"
            placeholder="ユーザー名を入力"
            required
            autocomplete="username"
          />
          <div v-if="errors.userName" class="invalid-feedback">
            {{ errors.userName }}
          </div>
        </div>

        <div class="mb-3">
          <label for="password" class="form-label">パスワード</label>
          <input
            id="password"
            v-model="loginForm.password"
            type="password"
            class="form-control"
            :class="{ 'is-invalid': errors.password }"
            placeholder="パスワードを入力"
            required
            autocomplete="current-password"
          />
          <div v-if="errors.password" class="invalid-feedback">
            {{ errors.password }}
          </div>
        </div>

        <div class="d-grid">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="isLoading"
          >
            <span v-if="isLoading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              ログイン中...
            </span>
            <span v-else>ログイン</span>
          </button>
        </div>
      </form>

      <div v-if="loginError" class="alert alert-danger mt-3" role="alert">
        {{ loginError }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const appTitle = process.env.VUE_APP_TITLE || '日報管理システム';

const loginForm = reactive({
  userName: '',
  password: ''
});

const errors = reactive({
  userName: '',
  password: ''
});

const isLoading = ref(false);
const loginError = ref('');

const validateForm = () => {
  errors.userName = '';
  errors.password = '';
  loginError.value = '';

  let isValid = true;

  if (!loginForm.userName.trim()) {
    errors.userName = 'ユーザー名を入力してください';
    isValid = false;
  }

  if (!loginForm.password) {
    errors.password = 'パスワードを入力してください';
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) {
    return;
  }

  isLoading.value = true;
  loginError.value = '';

  try {
    await authStore.login(loginForm.userName, loginForm.password);
    notificationStore.success('ログインしました');

    // ロール別初期画面への遷移
    if (authStore.isAdmin) {
      // 管理者はホーム画面へ
      router.push('/home');
    } else {
      // 新入社員・先輩社員は日報登録画面へ
      router.push('/daily-reports/new');
    }
  } catch (error) {
    loginError.value = error.response?.data?.error || 'ログインに失敗しました。ユーザー名とパスワードを確認してください。';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    color: #333;
    margin-bottom: 10px;
  }

  p {
    font-size: 14px;
  }
}

.form-label {
  font-weight: 500;
  color: #555;
}

.btn-primary {
  padding: 12px;
  font-weight: 500;
}
</style>
