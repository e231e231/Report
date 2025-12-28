<template>
  <div class="information-list">
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-6">
          <h2>お知らせ</h2>
        </div>
        <div v-if="authStore.isAdmin" class="col-md-6 text-end">
          <router-link to="/information/new" class="btn btn-primary">
            <i class="bi bi-plus-circle me-2"></i>
            新規登録
          </router-link>
        </div>
      </div>

      <div class="information-container">
        <div
          v-for="info in informationList"
          :key="info.id"
          class="information-item"
        >
          <div class="info-header">
            <div>
              <span :class="['badge', 'me-2', getCategoryBadgeClass(info.category)]">
                {{ info.category }}
              </span>
              <span class="text-muted">{{ formatDate(info.date) }}</span>
            </div>
            <div v-if="authStore.isAdmin" class="info-actions">
              <button
                class="btn btn-sm btn-outline-primary me-2"
                @click="editInformation(info.id)"
              >
                編集
              </button>
              <button
                class="btn btn-sm btn-outline-danger"
                @click="confirmDelete(info)"
              >
                削除
              </button>
            </div>
          </div>

          <h4 class="info-title">{{ info.title }}</h4>
          <div class="info-content">
            <MarkdownRenderer :content="info.content" />
          </div>

          <div class="info-footer">
            <small class="text-muted">作成者: {{ info.employeeName }}</small>
          </div>
        </div>

        <div v-if="informationList.length === 0" class="text-center py-5 text-muted">
          お知らせはまだありません
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <h5>お知らせの削除</h5>
        <p>{{ deleteTarget?.title }} を削除しますか？</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="showDeleteModal = false">
            キャンセル
          </button>
          <button class="btn btn-danger" @click="deleteInformation">
            削除
          </button>
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import informationService from '@/services/informationService';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { formatDate } from '@/utils/formatters';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const informationList = ref([]);
const showDeleteModal = ref(false);
const deleteTarget = ref(null);

const getCategoryBadgeClass = (category) => {
  const categoryMap = {
    'お知らせ': 'bg-info',
    '重要': 'bg-danger',
    'メンテナンス': 'bg-warning',
    'その他': 'bg-secondary'
  };
  return categoryMap[category] || 'bg-secondary';
};

const loadInformation = async () => {
  isLoading.value = true;
  try {
    const response = await informationService.getAll();
    informationList.value = response.data;
  } catch (error) {
    notificationStore.error('お知らせの取得に失敗しました');
  } finally {
    isLoading.value = false;
  }
};

const editInformation = (id) => {
  router.push(`/information/${id}/edit`);
};

const confirmDelete = (info) => {
  deleteTarget.value = info;
  showDeleteModal.value = true;
};

const deleteInformation = async () => {
  if (!deleteTarget.value) return;

  try {
    await informationService.delete(deleteTarget.value.id);
    notificationStore.success('お知らせを削除しました');
    showDeleteModal.value = false;
    deleteTarget.value = null;
    await loadInformation();
  } catch (error) {
    notificationStore.error('お知らせの削除に失敗しました');
  }
};

onMounted(() => {
  loadInformation();
});
</script>

<style scoped lang="scss">
.information-list {
  min-height: calc(100vh - 120px);
}

.information-container {
  max-width: 900px;
  margin: 0 auto;
}

.information-item {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 25px;
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.info-actions {
  display: flex;
  gap: 5px;
}

.info-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
}

.info-content {
  margin-bottom: 15px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.info-footer {
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
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
