<template>
  <div class="employee-list">
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-6">
          <h2>従業員管理</h2>
        </div>
        <div class="col-md-6 text-end">
          <button class="btn btn-primary" @click="showRegisterModal = true">
            <i class="bi bi-plus-circle me-2"></i>
            新規登録
          </button>
        </div>
      </div>

      <div class="employee-table-container">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>従業員コード</th>
              <th>ユーザー名</th>
              <th>従業員名</th>
              <th>権限</th>
              <th>カラー</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in employees" :key="employee.id">
              <td>{{ employee.id }}</td>
              <td>{{ employee.userName }}</td>
              <td>{{ employee.employeeName }}</td>
                            <td>
                              <span :class="['badge', getRoleBadgeClass(employee.role)]">
                                {{ getRoleName(employee.role) }}
                              </span>
                            </td>
              <td>
                <span
                  class="color-preview"
                  :style="{ backgroundColor: employee.color }"
                ></span>
                {{ employee.color }}
              </td>
              <td>
                <button
                  class="btn btn-sm btn-outline-primary me-2"
                  @click="editEmployee(employee)"
                >
                  編集
                </button>
                <button
                  class="btn btn-sm btn-outline-danger"
                  @click="confirmDelete(employee)"
                  :disabled="employee.id === authStore.employeeId"
                >
                  削除
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="employees.length === 0" class="text-center py-5 text-muted">
          従業員が登録されていません
        </div>
      </div>
    </div>

    <!-- Register/Edit Modal -->
    <div v-if="showRegisterModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content large" @click.stop>
        <h5>{{ showEditModal ? '従業員編集' : '従業員登録' }}</h5>

        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="employeeId" class="form-label required">従業員コード</label>
            <input
              id="employeeId"
              v-model="employeeForm.id"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.id }"
              :disabled="showEditModal"
              placeholder="EMPXXXXX"
              required
            />
            <div v-if="errors.id" class="invalid-feedback">
              {{ errors.id }}
            </div>
          </div>

          <div class="mb-3">
            <label for="userName" class="form-label required">ユーザー名</label>
            <input
              id="userName"
              v-model="employeeForm.userName"
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
              v-model="employeeForm.employeeName"
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
            <label for="password" class="form-label" :class="{ required: !showEditModal }">
              パスワード{{ showEditModal ? '（変更する場合のみ）' : '' }}
            </label>
            <input
              id="password"
              v-model="employeeForm.password"
              type="password"
              class="form-control"
              :class="{ 'is-invalid': errors.password }"
              :required="!showEditModal"
            />
            <div v-if="errors.password" class="invalid-feedback">
              {{ errors.password }}
            </div>
          </div>

                    <div class="mb-3">
                      <label for="role" class="form-label required">権限</label>
                      <select
                        id="role"
                        v-model="employeeForm.role"
                        class="form-select"
                        :class="{ 'is-invalid': errors.role }"
                        required
                      >
                        <option :value="0">管理者</option>
                        <option :value="1">従業員</option>
                      </select>
                      <div v-if="errors.role" class="invalid-feedback">
                        {{ errors.role }}
                      </div>
                    </div>

          <div class="mb-3">
            <label for="color" class="form-label required">カラー</label>
            <input
              id="color"
              v-model="employeeForm.color"
              type="color"
              class="form-control form-control-color"
              :class="{ 'is-invalid': errors.color }"
              required
            />
            <div v-if="errors.color" class="invalid-feedback">
              {{ errors.color }}
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModal">
              キャンセル
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
              <span v-if="isSubmitting">
                <span class="spinner-border spinner-border-sm me-2"></span>
                {{ showEditModal ? '更新中...' : '登録中...' }}
              </span>
              <span v-else>
                {{ showEditModal ? '更新' : '登録' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h5>従業員の削除</h5>
        <p>{{ deleteTarget?.employeeName }} を削除しますか？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">
            キャンセル
          </button>
          <button class="btn btn-danger" @click="deleteEmployee">
            削除
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import employeeService from '@/services/employeeService';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { getRoleName } from '@/utils/formatters';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const isSubmitting = ref(false);
const employees = ref([]);
const showRegisterModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);

const employeeForm = reactive({
  id: '',
  userName: '',
  employeeName: '',
  password: '',
  role: 1,
  color: '#3498db'
});

const errors = reactive({
  id: '',
  userName: '',
  employeeName: '',
  password: '',
  role: '',
  color: ''
});

const getRoleBadgeClass = (role) => {
  return role === 0 ? 'bg-danger' : 'bg-primary';
};

const resetForm = () => {
  employeeForm.id = '';
  employeeForm.userName = '';
  employeeForm.employeeName = '';
  employeeForm.password = '';
  employeeForm.role = 1;
  employeeForm.color = '#3498db';

  errors.id = '';
  errors.userName = '';
  errors.employeeName = '';
  errors.password = '';
  errors.role = '';
  errors.color = '';
};

const closeModal = () => {
  showRegisterModal.value = false;
  showEditModal.value = false;
  resetForm();
};

const loadEmployees = async () => {
  isLoading.value = true;
  try {
    const response = await employeeService.getAll();
    employees.value = response.data;
  } catch (error) {
    notificationStore.error('従業員一覧の取得に失敗しました');
  } finally {
    isLoading.value = false;
  }
};

const validateForm = () => {
  Object.keys(errors).forEach(key => errors[key] = '');

  let isValid = true;

  if (!showEditModal.value && !employeeForm.id.trim()) {
    errors.id = '従業員コードを入力してください';
    isValid = false;
  }

  if (!employeeForm.userName.trim()) {
    errors.userName = 'ユーザー名を入力してください';
    isValid = false;
  }

  if (!employeeForm.employeeName.trim()) {
    errors.employeeName = '従業員名を入力してください';
    isValid = false;
  }

  if (!showEditModal.value && !employeeForm.password) {
    errors.password = 'パスワードを入力してください';
    isValid = false;
  } else if (employeeForm.password && employeeForm.password.length < 6) {
    errors.password = 'パスワードは6文字以上にしてください';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

    try {
      const data = {
        userName: employeeForm.userName,
        employeeName: employeeForm.employeeName,
        role: employeeForm.role,
        color: employeeForm.color
      };

    if (employeeForm.password) {
      data.password = employeeForm.password;
    }

    if (showEditModal.value) {
      await employeeService.update(employeeForm.id, data);
      notificationStore.success('従業員情報を更新しました');
    } else {
      data.id = employeeForm.id;
      await employeeService.create(data);
      notificationStore.success('従業員を登録しました');
    }

    closeModal();
    await loadEmployees();
  } catch (error) {
    const errorMessage = error.response?.data?.error ||
      (showEditModal.value ? '従業員情報の更新に失敗しました' : '従業員の登録に失敗しました');
    notificationStore.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const editEmployee = (employee) => {
  employeeForm.id = employee.id;
  employeeForm.userName = employee.userName;
  employeeForm.employeeName = employee.employeeName;
  employeeForm.password = '';
  employeeForm.role = employee.role;
  employeeForm.color = employee.color;
  showEditModal.value = true;
};

const confirmDelete = (employee) => {
  deleteTarget.value = employee;
  showDeleteModal.value = true;
};

const deleteEmployee = async () => {
  if (!deleteTarget.value) return;

  try {
    await employeeService.delete(deleteTarget.value.id);
    notificationStore.success('従業員を削除しました');
    showDeleteModal.value = false;
    deleteTarget.value = null;
    await loadEmployees();
  } catch (error) {
    notificationStore.error('従業員の削除に失敗しました');
  }
};

onMounted(() => {
  loadEmployees();
});
</script>

<style scoped lang="scss">
.employee-list {
  min-height: calc(100vh - 120px);
}

.employee-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.color-preview {
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin-right: 5px;
  border: 1px solid #ddd;
  vertical-align: middle;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;

  &.large {
    max-width: 600px;
  }

  h5 {
    margin-bottom: 20px;
  }

  p {
    margin-bottom: 20px;
  }
}

.form-label.required::after {
  content: ' *';
  color: #dc3545;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
