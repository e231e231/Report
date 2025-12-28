<template>
  <div class="employee-register">
    <div class="container mt-4">
      <div class="row mb-3">
        <div class="col-md-12">
          <button class="btn btn-secondary" @click="goBack">
            &lt; 戻る
          </button>
        </div>
      </div>

      <div class="form-card">
        <h3>従業員登録</h3>

        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="userName" class="form-label required">ユーザー名</label>
            <input
              id="userName"
              v-model="form.userName"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.userName }"
              required
            />
            <div v-if="errors.userName" class="invalid-feedback">
              {{ errors.userName }}
            </div>
          </div>

          <div class="mb-3">
            <label for="employeeName" class="form-label required">従業員名</label>
            <input
              id="employeeName"
              v-model="form.employeeName"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.employeeName }"
              required
            />
            <div v-if="errors.employeeName" class="invalid-feedback">
              {{ errors.employeeName }}
            </div>
          </div>

          <div class="mb-3">
            <label for="password" class="form-label required">パスワード</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              required
            />
            <div v-if="errors.password" class="invalid-feedback">
              {{ errors.password }}
            </div>
          </div>

          <div class="mb-3">
            <label for="role" class="form-label required">ロール</label>
            <select
              id="role"
              v-model="form.role"
              class="form-control"
              :class="{ 'is-invalid': errors.role }"
              required
            >
              <option value="">選択してください</option>
              <option value="0">管理者</option>
              <option value="1">従業員</option>
            </select>
            <div v-if="errors.role" class="invalid-feedback">
              {{ errors.role }}
            </div>
          </div>

          <div class="mb-3">
            <label for="color" class="form-label">カラー</label>
            <input
              id="color"
              v-model="form.color"
              type="color"
              class="form-control"
            />
          </div>

          <div class="form-actions">
            <button
              type="button"
              class="btn btn-secondary"
              @click="goBack"
            >
              キャンセル
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                登録中...
              </span>
              <span v-else>
                登録
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import employeeService from '@/services/employeeService';
import { useNotificationStore } from '@/stores/notification';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const router = useRouter();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const isSubmitting = ref(false);

const form = reactive({
  userName: '',
  employeeName: '',
  password: '',
  role: '',
  color: '#007bff'
});

const errors = reactive({
  userName: '',
  employeeName: '',
  password: '',
  role: ''
});

const validateForm = () => {
  errors.userName = '';
  errors.employeeName = '';
  errors.password = '';
  errors.role = '';

  let isValid = true;

  if (!form.userName.trim()) {
    errors.userName = 'ユーザー名を入力してください';
    isValid = false;
  }

  if (!form.employeeName.trim()) {
    errors.employeeName = '従業員名を入力してください';
    isValid = false;
  }

  if (!form.password) {
    errors.password = 'パスワードを入力してください';
    isValid = false;
  } else if (form.password.length < 6) {
    errors.password = 'パスワードは6文字以上で入力してください';
    isValid = false;
  }

  if (form.role === '') {
    errors.role = 'ロールを選択してください';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    await employeeService.create({
      userName: form.userName,
      employeeName: form.employeeName,
      password: form.password,
      role: parseInt(form.role),
      color: form.color
    });
    notificationStore.success('従業員を登録しました');
    router.push('/employees');
  } catch (error) {
    const errorMessage = error.response?.data?.error || '従業員の登録に失敗しました';
    notificationStore.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss">
.employee-register {
  min-height: calc(100vh - 120px);
}

.form-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 30px;

  h3 {
    margin-bottom: 25px;
  }
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}
</style>
