<template>
  <div class="information-form">
    <div class="container mt-4">
      <div class="row mb-3">
        <div class="col-md-12">
          <button class="btn btn-secondary" @click="goBack">
            &lt; 戻る
          </button>
        </div>
      </div>

      <div class="form-card">
        <h3>{{ isEditMode ? 'お知らせ編集' : 'お知らせ登録' }}</h3>

        <form @submit.prevent="handleSubmit">
          <div class="mb-3">
            <label for="title" class="form-label required">タイトル</label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              class="form-control"
              :class="{ 'is-invalid': errors.title }"
              placeholder="お知らせのタイトルを入力"
              required
            />
            <div v-if="errors.title" class="invalid-feedback">
              {{ errors.title }}
            </div>
          </div>

          <div class="mb-3">
            <label for="category" class="form-label required">カテゴリ</label>
            <select
              id="category"
              v-model="form.category"
              class="form-select"
              :class="{ 'is-invalid': errors.category }"
              required
            >
              <option value="">選択してください</option>
              <option value="お知らせ">お知らせ</option>
              <option value="重要">重要</option>
              <option value="メンテナンス">メンテナンス</option>
              <option value="その他">その他</option>
            </select>
            <div v-if="errors.category" class="invalid-feedback">
              {{ errors.category }}
            </div>
          </div>

          <div class="mb-3">
            <label for="content" class="form-label required">内容</label>
            <MarkdownEditor
              v-model="form.content"
              placeholder="お知らせの内容を入力してください..."
            />
            <div v-if="errors.content" class="invalid-feedback d-block">
              {{ errors.content }}
            </div>
            <div class="form-text">
              Markdown形式で記述できます。画像はURL形式で表示できます。
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
import informationService from '@/services/informationService';
import { useNotificationStore } from '@/stores/notification';
import MarkdownEditor from '@/components/Common/MarkdownEditor.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const route = useRoute();
const router = useRouter();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const isSubmitting = ref(false);
const isEditMode = computed(() => !!route.params.id);

const form = reactive({
  title: '',
  category: '',
  content: ''
});

const errors = reactive({
  title: '',
  category: '',
  content: ''
});

const validateForm = () => {
  errors.title = '';
  errors.category = '';
  errors.content = '';

  let isValid = true;

  if (!form.title.trim()) {
    errors.title = 'タイトルを入力してください';
    isValid = false;
  }

  if (!form.category) {
    errors.category = 'カテゴリを選択してください';
    isValid = false;
  }

  if (!form.content.trim()) {
    errors.content = '内容を入力してください';
    isValid = false;
  }

  return isValid;
};

const loadInformation = async () => {
  if (!isEditMode.value) return;

  isLoading.value = true;
  try {
    const response = await informationService.getById(route.params.id);
    const info = response.data;

    form.title = info.title;
    form.category = info.category;
    form.content = info.content;
  } catch (error) {
    notificationStore.error('お知らせの取得に失敗しました');
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
      await informationService.update(route.params.id, {
        title: form.title,
        category: form.category,
        content: form.content
      });
      notificationStore.success('お知らせを更新しました');
    } else {
      await informationService.create({
        title: form.title,
        category: form.category,
        content: form.content
      });
      notificationStore.success('お知らせを登録しました');
    }
    router.push('/information');
  } catch (error) {
    const errorMessage = error.response?.data?.error ||
      (isEditMode.value ? 'お知らせの更新に失敗しました' : 'お知らせの登録に失敗しました');
    notificationStore.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const goBack = () => {
  router.push('/information');
};

onMounted(() => {
  loadInformation();
});
</script>

<style scoped lang="scss">
.information-form {
  min-height: calc(100vh - 120px);
}

.form-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;

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
