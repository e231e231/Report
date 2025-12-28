<template>
  <div class="profile-page">
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-12">
          <h2>プロフィール設定</h2>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>ユーザー情報</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label text-muted">従業員コード</label>
                <p class="form-control-plaintext">{{ authStore.employeeId }}</p>
              </div>

              <div class="mb-3">
                <label class="form-label text-muted">ユーザー名</label>
                <p class="form-control-plaintext">{{ authStore.userName }}</p>
              </div>

              <div class="mb-3">
                <label class="form-label text-muted">従業員名</label>
                <p class="form-control-plaintext">{{ authStore.employeeName }}</p>
              </div>

                            <div class="mb-3">
                              <label class="form-label text-muted">権限</label>
                              <p class="form-control-plaintext">
                                <span :class="['badge', authStore.isAdmin ? 'bg-danger' : 'bg-primary']">
                                  {{ getRoleName(authStore.role) }}
                                </span>
                              </p>
                            </div>

              <div class="mb-3">
                <label class="form-label text-muted">カラー</label>
                <div class="d-flex align-items-center">
                  <span
                    class="color-preview me-2"
                    :style="{ backgroundColor: authStore.userColor }"
                  ></span>
                  <span>{{ authStore.userColor }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>パスワード変更</h5>
            </div>
            <div class="card-body">
              <form @submit.prevent="handlePasswordChange">
                <div class="mb-3">
                  <label for="currentPassword" class="form-label required">
                    現在のパスワード
                  </label>
                  <input
                    id="currentPassword"
                    v-model="passwordForm.currentPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.currentPassword }"
                    autocomplete="current-password"
                    required
                  />
                  <div v-if="errors.currentPassword" class="invalid-feedback">
                    {{ errors.currentPassword }}
                  </div>
                </div>

                <div class="mb-3">
                  <label for="newPassword" class="form-label required">
                    新しいパスワード
                  </label>
                  <input
                    id="newPassword"
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.newPassword }"
                    autocomplete="new-password"
                    required
                  />
                  <div v-if="errors.newPassword" class="invalid-feedback">
                    {{ errors.newPassword }}
                  </div>
                  <div class="form-text">
                    パスワードは6文字以上で設定してください
                  </div>
                </div>

                <div class="mb-3">
                  <label for="confirmPassword" class="form-label required">
                    新しいパスワード（確認）
                  </label>
                  <input
                    id="confirmPassword"
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    class="form-control"
                    :class="{ 'is-invalid': errors.confirmPassword }"
                    autocomplete="new-password"
                    required
                  />
                  <div v-if="errors.confirmPassword" class="invalid-feedback">
                    {{ errors.confirmPassword }}
                  </div>
                </div>

                <div class="d-grid">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    :disabled="isSubmitting"
                  >
                    <span v-if="isSubmitting">
                      <span class="spinner-border spinner-border-sm me-2"></span>
                      変更中...
                    </span>
                    <span v-else>パスワード変更</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div class="card mt-3">
            <div class="card-header">
              <h5>カラー設定</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">カラー選択</label>
                <div class="color-picker-container">
                  <input
                    type="color"
                    v-model="selectedColor"
                    class="form-control form-control-color"
                    title="カラーを選択"
                  />
                  <div class="color-display">
                    <span
                      class="color-preview-large"
                      :style="{ backgroundColor: selectedColor }"
                    ></span>
                    <span class="color-code">{{ selectedColor }}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-outline-secondary"
                  @click="randomizeColor"
                >
                  <i class="bi bi-shuffle"></i>
                  ランダム
                </button>
                <button
                  type="button"
                  class="btn btn-primary"
                  @click="updateColor"
                  :disabled="isUpdatingColor || selectedColor === authStore.userColor"
                >
                  <span v-if="isUpdatingColor">
                    <span class="spinner-border spinner-border-sm me-2"></span>
                    更新中...
                  </span>
                  <span v-else>
                    <i class="bi bi-check-lg"></i>
                    カラー変更
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import employeeService from '@/services/employeeService';
import { getRoleName } from '@/utils/formatters';

const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const isSubmitting = ref(false);
const isUpdatingColor = ref(false);
const selectedColor = ref('#007bff');

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const errors = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const resetPasswordForm = () => {
  passwordForm.currentPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';

  errors.currentPassword = '';
  errors.newPassword = '';
  errors.confirmPassword = '';
};

const validatePasswordForm = () => {
  errors.currentPassword = '';
  errors.newPassword = '';
  errors.confirmPassword = '';

  let isValid = true;

  if (!passwordForm.currentPassword) {
    errors.currentPassword = '現在のパスワードを入力してください';
    isValid = false;
  }

  if (!passwordForm.newPassword) {
    errors.newPassword = '新しいパスワードを入力してください';
    isValid = false;
  } else if (passwordForm.newPassword.length < 6) {
    errors.newPassword = 'パスワードは6文字以上にしてください';
    isValid = false;
  }

  if (!passwordForm.confirmPassword) {
    errors.confirmPassword = 'パスワード（確認）を入力してください';
    isValid = false;
  } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    errors.confirmPassword = 'パスワードが一致しません';
    isValid = false;
  }

  return isValid;
};

const handlePasswordChange = async () => {
  if (!validatePasswordForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await authStore.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );
    notificationStore.success('パスワードを変更しました');
    resetPasswordForm();
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'パスワードの変更に失敗しました';
    notificationStore.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const randomizeColor = () => {
  // ランダムな色を生成
  const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  selectedColor.value = randomColor;
};

const updateColor = async () => {
  isUpdatingColor.value = true;

  try {
    await employeeService.updateColor(authStore.employeeId, selectedColor.value);
    authStore.userColor = selectedColor.value;
    notificationStore.success('カラーを変更しました');
  } catch (error) {
    const errorMessage = error.response?.data?.error || 'カラーの変更に失敗しました';
    notificationStore.error(errorMessage);
  } finally {
    isUpdatingColor.value = false;
  }
};

onMounted(() => {
  // 現在のユーザーカラーを設定
  if (authStore.userColor) {
    selectedColor.value = authStore.userColor;
  }
});
</script>

<style scoped lang="scss">
.profile-page {
  min-height: calc(100vh - 120px);
}

.card {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;

  .card-header {
    background-color: #f8f9fa;
    border-bottom: 2px solid #dee2e6;

    h5 {
      margin: 0;
    }
  }
}

.form-control-plaintext {
  font-weight: 500;
  color: #333;
}

.color-preview {
  display: inline-block;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #ddd;
}

.color-picker-container {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;

  .form-control-color {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 3px solid #dee2e6;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #007bff;
      transform: scale(1.05);
    }
  }

  .color-display {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .color-preview-large {
    display: inline-block;
    width: 50px;
    height: 50px;
    border-radius: 8px;
    border: 2px solid #dee2e6;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .color-code {
    font-family: 'Courier New', monospace;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}
</style>
