<template>
  <div class="daily-report-form">
    <div class="container mt-4">
      <div class="row mb-3">
        <div class="col-md-12">
          <button class="btn btn-secondary" @click="goBack">
            &lt; 戻る
          </button>
        </div>
      </div>

      <!-- 新入社員向け通知エリア -->
      <div v-if="showNotifications && recentMentions.length > 0" class="notifications-card mb-3">
        <h5 class="notifications-title">
          <i class="bi bi-bell-fill"></i>
          あなた宛てのコメント
        </h5>
        <div class="notifications-list">
          <div
            v-for="mention in recentMentions"
            :key="mention.id"
            class="notification-item"
            @click="viewReport(mention.dailyReport.id)"
          >
            <div class="notification-header">
              <span
                class="employee-indicator"
                :style="{ backgroundColor: mention.employee.color }"
              ></span>
              <span class="employee-name">{{ mention.employee.employeeName }}</span>
              <span class="notification-date">{{ formatDate(mention.date) }}</span>
            </div>
            <div class="notification-content">
              {{ truncate(mention.content, 80) }}
            </div>
          </div>
        </div>
        <div class="notifications-footer">
          <button
            type="button"
            class="btn btn-link btn-sm"
            @click="viewAllMentions"
          >
            もっと見る →
          </button>
        </div>
      </div>

      <div class="form-card">
        <h3>{{ isEditMode ? '日報編集' : '日報登録' }}</h3>

        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="calendar" class="form-label required">日付</label>
            <input
              id="calendar"
              v-model="form.calendar"
              type="date"
              class="form-control"
              :class="{ 'is-invalid': errors.calendar }"
              :max="maxDate"
              required
            />
            <div v-if="errors.calendar" class="invalid-feedback">
              {{ errors.calendar }}
            </div>
          </div>

          <div class="mb-3">
            <label for="content" class="form-label required">内容</label>
            <MarkdownEditor
              v-model="form.content"
              placeholder="今日の業務内容を入力してください...

【実施内容】
・

【明日の予定】
・

【所感・備考】
・"
            />
            <div v-if="errors.content" class="invalid-feedback d-block">
              {{ errors.content }}
            </div>
            <div class="form-text">
              業務内容を具体的に記入してください。Markdown形式で記述できます。画像はURL形式で表示できます。
            </div>
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
                {{ isEditMode ? '更新中...' : '登録中...' }}
              </span>
              <span v-else>
                {{ isEditMode ? '更新' : '登録' }}
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
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dailyReportService from '@/services/dailyReportService';
import feedbackService from '@/services/feedbackService';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { formatDate, truncate } from '@/utils/formatters';
import MarkdownEditor from '@/components/Common/MarkdownEditor.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const isSubmitting = ref(false);
const isEditMode = computed(() => !!route.params.id);
const recentMentions = ref([]);

// 新入社員（Role=1）のみ通知を表示
const showNotifications = computed(() => {
  return authStore.user && authStore.user.role === 1;
});

const form = reactive({
  calendar: getTodayDate(),
  content: ''
});

const errors = reactive({
  calendar: '',
  content: ''
});

const maxDate = computed(() => getTodayDate());

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const validateForm = () => {
  errors.calendar = '';
  errors.content = '';

  let isValid = true;

  if (!form.calendar) {
    errors.calendar = '日付を選択してください';
    isValid = false;
  } else {
    const selectedDate = new Date(form.calendar);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
      errors.calendar = '未来の日付は選択できません';
      isValid = false;
    }
  }

  if (!form.content.trim()) {
    errors.content = '内容を入力してください';
    isValid = false;
  } else if (form.content.trim().length < 10) {
    errors.content = '内容は10文字以上入力してください';
    isValid = false;
  }

  return isValid;
};

const loadReport = async () => {
  if (!isEditMode.value) return;

  isLoading.value = true;
  try {
    const response = await dailyReportService.getById(route.params.id);
    const report = response.data;

    // Convert calendar to YYYY-MM-DD format
    const calendarDate = new Date(report.calendar);
    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const day = String(calendarDate.getDate()).padStart(2, '0');

    form.calendar = `${year}-${month}-${day}`;
    form.content = report.content;
  } catch (error) {
    notificationStore.error('日報の取得に失敗しました');
    goBack();
  } finally {
    isLoading.value = false;
  }
};

const handleSubmit = async () => {
  if (!validateForm()) {
    return;
  }

  isSubmitting.value = true;

  try {
    if (isEditMode.value) {
      await dailyReportService.update(route.params.id, {
        calendar: form.calendar,
        content: form.content
      });
      notificationStore.success('日報を更新しました');
      router.push(`/daily-reports/${route.params.id}`);
    } else {
      const response = await dailyReportService.create({
        calendar: form.calendar,
        content: form.content
      });
      notificationStore.success('日報を登録しました');
      router.push(`/daily-reports/${response.data.id}`);
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error ||
      (isEditMode.value ? '日報の更新に失敗しました' : '日報の登録に失敗しました');
    notificationStore.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.back();
};

const loadRecentMentions = async () => {
  if (!showNotifications.value) return;

  try {
    const response = await feedbackService.getRecentMentions(5);
    recentMentions.value = response.data;
  } catch (error) {
    console.error('Failed to load recent mentions:', error);
    // エラーが発生しても通知は必須ではないため、ユーザーには通知しない
  }
};

const viewReport = (reportId) => {
  router.push(`/daily-reports/${reportId}`);
};

const viewAllMentions = () => {
  router.push('/mentions');
};

onMounted(async () => {
  await loadReport();
  await loadRecentMentions();
});
</script>

<style scoped lang="scss">
.daily-report-form {
  min-height: calc(100vh - 120px);
}

.notifications-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  padding: 20px;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .notifications-title {
    margin-bottom: 15px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      font-size: 20px;
    }
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 10px;
  }

  .notification-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 12px 15px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateX(5px);
    }

    .notification-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;

      .employee-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }

      .employee-name {
        font-size: 14px;
        font-weight: 500;
      }

      .notification-date {
        font-size: 12px;
        opacity: 0.8;
        margin-left: auto;
      }
    }

    .notification-content {
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }

  .notifications-footer {
    text-align: center;

    .btn-link {
      color: white;
      text-decoration: none;
      font-weight: 500;

      &:hover {
        text-decoration: underline;
        color: white;
      }
    }
  }
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

textarea {
  resize: vertical;
  font-family: 'Courier New', monospace;
  line-height: 1.6;
}

.preview-box {
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
  min-height: 100px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 30px;
}
</style>
