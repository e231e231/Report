<template>
  <div class="daily-report-detail">
    <div class="container mt-4 main-content">
      <div class="row mb-3">
        <div class="col-md-12">
          <button class="btn btn-secondary" @click="goBack">
            &lt; 戻る
          </button>
        </div>
      </div>

      <div v-if="report" class="report-card">
        <div class="report-header">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div class="author-info">
                <span
                  class="employee-indicator"
                  :style="{ backgroundColor: report.employee?.color || '#3498db' }"
                ></span>
                <h3>{{ report.employee?.employeeName || '不明' }}の日報</h3>
              </div>
              <p class="text-muted mb-2">{{ formatDateTime(report.date || report.calendar) }}</p>
            </div>
            <div v-if="canEdit">
              <button
                class="btn btn-primary btn-sm me-2"
                @click="editReport"
              >
                編集
              </button>
              <button
                class="btn btn-danger btn-sm"
                @click="showDeleteModal = true"
              >
                削除
              </button>
            </div>
          </div>
        </div>

        <div class="report-content">
          <MarkdownRenderer :content="report.content" />
        </div>

        <div class="report-stats">
          <div class="stats-row">
            <div class="reactions-wrapper">
              <span class="stats-label">リアクション:</span>
              <ReactionButton
                :target-id="report.id"
                :reactions="report.reactions || {}"
                :is-feedback="false"
                @reaction-toggled="loadReport"
              />
            </div>
            <div class="feedback-stats">
              <span class="feedback-icon">💬</span>
              <span class="stats-label">返信:</span>
              <span class="feedback-count-badge">{{ report.feedbacks?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <div class="feedbacks-section mt-4">
          <h5 class="section-title">フィードバック</h5>

          <div class="feedbacks-list">
            <div
              v-for="feedback in report.feedbacks"
              :key="feedback.id"
              class="feedback-item"
            >
              <div class="feedback-header">
                <div>
                  <span
                    class="employee-indicator"
                    :style="{ backgroundColor: feedback.employee?.color || '#3498db' }"
                  ></span>
                  <strong>{{ feedback.employee?.employeeName || '不明' }}</strong>
                  <span class="text-muted ms-2">
                    {{ formatDateTime(feedback.date) }}
                  </span>
                </div>
                <button
                  v-if="feedback.employee?.id === authStore.employeeId"
                  class="btn btn-sm btn-outline-danger"
                  @click="deleteFeedback(feedback.id)"
                >
                  削除
                </button>
              </div>
              <div class="feedback-content">
                <MarkdownRenderer :content="feedback.content" />
              </div>
              <div class="feedback-reactions">
                <ReactionButton
                  :target-id="feedback.id"
                  :reactions="feedback.reactions || {}"
                  :is-feedback="true"
                  @reaction-toggled="loadReport"
                />
              </div>
            </div>

            <div v-if="!report.feedbacks || report.feedbacks.length === 0" class="text-muted text-center py-3">
              フィードバックはまだありません
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Fixed Feedback Form at Bottom -->
    <div v-if="report" class="fixed-feedback-form" ref="feedbackFormRef">
      <div class="container">
        <div class="feedback-form-inner">
          <textarea
            v-model="newFeedback"
            class="form-control feedback-textarea"
            placeholder="フィードバックを入力... (Markdown記法が使えます)"
            rows="2"
          ></textarea>
          <button
            class="btn btn-primary"
            @click="submitFeedback"
            :disabled="!newFeedback.trim()"
          >
            送信
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h5>日報の削除</h5>
        <p>本当にこの日報を削除しますか？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">
            キャンセル
          </button>
          <button class="btn btn-danger" @click="deleteReport">
            削除
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import dailyReportService from '@/services/dailyReportService';
import feedbackService from '@/services/feedbackService';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { formatDateTime } from '@/utils/formatters';
import ReactionButton from '@/components/DailyReport/ReactionButton.vue';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const report = ref(null);
const newFeedback = ref('');
const showDeleteModal = ref(false);
const feedbackFormRef = ref(null);
const formHeight = ref(80);

const canEdit = computed(() => {
  return report.value && report.value.employeeId === authStore.employeeId;
});

const loadReport = async () => {
  isLoading.value = true;
  try {
    const response = await dailyReportService.getById(route.params.id);
    report.value = response.data;
  } catch (error) {
    notificationStore.error('日報の取得に失敗しました');
    goBack();
  } finally {
    isLoading.value = false;
  }
};

const submitFeedback = async () => {
  if (!newFeedback.value.trim()) return;

  try {
    await feedbackService.create({
      dailyReportId: report.value.id,
      content: newFeedback.value
    });

    newFeedback.value = '';
    notificationStore.success('フィードバックを送信しました');
    await loadReport();
  } catch (error) {
    notificationStore.error('フィードバックの送信に失敗しました');
  }
};

const deleteFeedback = async (feedbackId) => {
  if (!confirm('このフィードバックを削除しますか？')) return;

  try {
    await feedbackService.delete(feedbackId);
    notificationStore.success('フィードバックを削除しました');
    await loadReport();
  } catch (error) {
    notificationStore.error('フィードバックの削除に失敗しました');
  }
};

const editReport = () => {
  router.push(`/daily-reports/${report.value.id}/edit`);
};

const deleteReport = async () => {
  try {
    await dailyReportService.delete(report.value.id);
    notificationStore.success('日報を削除しました');
    router.push('/daily-reports');
  } catch (error) {
    notificationStore.error('日報の削除に失敗しました');
  } finally {
    showDeleteModal.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  loadReport();
});
</script>

<style scoped lang="scss">
.daily-report-detail {
  min-height: calc(100vh - 120px);
  padding-bottom: 120px;
}

.main-content {
  padding-bottom: 20px;
}

.report-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.report-header {
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 20px;
  margin-bottom: 20px;

  .author-info {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;

    .employee-indicator {
      display: inline-block;
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    h3 {
      margin: 0;
      font-size: 1.5rem;
    }
  }
}

.report-content {
  margin-bottom: 20px;

  .content-text {
    font-size: 16px;
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.report-stats {
  padding: 20px 0;
  border-top: 2px solid #e9ecef;
  border-bottom: 2px solid #e9ecef;
  margin: 20px 0;

  .stats-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .reactions-wrapper {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
  }

  .feedback-stats {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 20px;

    .feedback-icon {
      font-size: 20px;
      line-height: 1;
    }

    .feedback-count-badge {
      font-size: 16px;
      font-weight: 700;
      color: #007bff;
      background-color: white;
      padding: 4px 12px;
      border-radius: 12px;
      min-width: 32px;
      text-align: center;
    }
  }

  .stats-label {
    font-weight: 600;
    color: #495057;
    font-size: 14px;
  }
}

.feedbacks-section {
  .section-title {
    margin-bottom: 15px;
    font-weight: 600;
    color: #333;
  }
}

.feedbacks-list {
  .feedback-item {
    background: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .feedback-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .employee-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 5px;
  }

  .feedback-content {
    margin-bottom: 10px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .feedback-reactions {
    margin-top: 10px;
  }
}

.fixed-feedback-form {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 2px solid #e9ecef;
  padding: 15px 0;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

  .feedback-form-inner {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }

  .feedback-textarea {
    flex: 1;
    resize: vertical;
    min-height: 40px;
    max-height: 200px;
  }

  .btn {
    height: 40px;
    white-space: nowrap;
  }
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

  h5 {
    margin-bottom: 15px;
  }

  p {
    margin-bottom: 20px;
  }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
