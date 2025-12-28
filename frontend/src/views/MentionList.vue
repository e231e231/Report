<template>
  <div class="mention-list">
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-12">
          <h2>メンション</h2>
          <p class="text-muted">あなたへのメンション一覧</p>
        </div>
      </div>

      <div class="mentions-container">
        <div
          v-for="mention in mentions"
          :key="mention.id"
          class="mention-item"
          @click="viewDailyReport(mention.dailyReportId)"
        >
          <div class="mention-header">
            <div>
              <span
                class="employee-indicator"
                :style="{ backgroundColor: mention.feedbackEmployeeColor }"
              ></span>
              <strong>{{ mention.feedbackEmployeeName }}</strong>
              <span class="text-muted ms-2">
                {{ formatDateTime(mention.feedbackDate) }}
              </span>
            </div>
            <span class="badge bg-info">メンション</span>
          </div>

          <div class="mention-content">
            <div class="feedback-text">
              <MarkdownRenderer :content="mention.feedbackContent" />
            </div>
          </div>

          <div class="mention-footer">
            <small class="text-muted">
              {{ mention.dailyReportEmployeeName }}の日報（{{ formatDate(mention.dailyReportDate) }}）へのフィードバック
            </small>
          </div>
        </div>

        <div v-if="mentions.length === 0 && !isLoading" class="text-center py-5 text-muted">
          メンションはまだありません
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import feedbackService from '@/services/feedbackService';
import { useNotificationStore } from '@/stores/notification';
import { formatDate, formatDateTime } from '@/utils/formatters';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const router = useRouter();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const mentions = ref([]);

const loadMentions = async () => {
  isLoading.value = true;
  try {
    const response = await feedbackService.getMentions();
    mentions.value = response.data;
  } catch (error) {
    notificationStore.error('メンションの取得に失敗しました');
  } finally {
    isLoading.value = false;
  }
};

const viewDailyReport = (dailyReportId) => {
  router.push(`/daily-reports/${dailyReportId}`);
};

onMounted(() => {
  loadMentions();
});
</script>

<style scoped lang="scss">
.mention-list {
  min-height: calc(100vh - 120px);
}

.mentions-container {
  max-width: 900px;
  margin: 0 auto;
}

.mention-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.mention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.employee-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 5px;
}

.mention-content {
  margin-bottom: 15px;
}

.feedback-text {
  padding: 15px;
  background-color: #f8f9fa;
  border-left: 4px solid #0d6efd;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.mention-footer {
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
}
</style>
