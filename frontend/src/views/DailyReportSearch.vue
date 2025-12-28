<template>
  <div class="daily-report-search">
    <div class="container mt-4">
      <div class="row mb-4">
        <div class="col-md-12">
          <h2>日報検索</h2>
        </div>
      </div>

      <div class="search-card">
        <h5 class="mb-3">検索条件</h5>

        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">従業員</label>
            <select v-model="searchForm.employeeId" class="form-select">
              <option value="">全員</option>
              <option
                v-for="employee in employees"
                :key="employee.id"
                :value="employee.id"
              >
                {{ employee.employeeName }}
              </option>
            </select>
          </div>

          <div class="col-md-6">
            <label class="form-label">年度</label>
            <select v-model="searchForm.year" class="form-select">
              <option value="">すべて</option>
              <option
                v-for="year in yearOptions"
                :key="year"
                :value="year"
              >
                {{ year }}年
              </option>
            </select>
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-6">
            <label class="form-label">開始日</label>
            <input
              v-model="searchForm.startDate"
              type="date"
              class="form-control"
            />
          </div>

          <div class="col-md-6">
            <label class="form-label">終了日</label>
            <input
              v-model="searchForm.endDate"
              type="date"
              class="form-control"
            />
          </div>
        </div>

        <div class="row mb-3">
          <div class="col-md-12">
            <label class="form-label">キーワード</label>
            <input
              v-model="searchForm.keyword"
              type="text"
              class="form-control"
              placeholder="日報の内容を検索..."
            />
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-secondary" @click="resetSearch">
            リセット
          </button>
          <button class="btn btn-primary" @click="executeSearch">
            検索
          </button>
        </div>
      </div>

      <div v-if="hasSearched" class="results-section mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5>検索結果 ({{ searchResults.length }}件)</h5>
          <button
            v-if="searchForm.year"
            class="btn btn-success btn-sm"
            @click="downloadCSV"
            :disabled="isDownloading"
          >
            <span v-if="isDownloading">
              <span class="spinner-border spinner-border-sm me-2"></span>
              ダウンロード中...
            </span>
            <span v-else>
              <i class="bi bi-download"></i>
              CSV出力
            </span>
          </button>
        </div>

        <div class="results-list">
          <div
            v-for="report in searchResults"
            :key="report.id"
            class="result-item"
            @click="viewReport(report.id)"
          >
            <div class="result-header">
              <div>
                <span
                  class="employee-indicator"
                  :style="{ backgroundColor: report.employeeColor }"
                ></span>
                <strong>{{ report.employeeName }}</strong>
                <span class="text-muted ms-3">
                  {{ formatDate(report.calendar) }}
                </span>
              </div>
              <div class="result-meta">
                <span class="badge bg-secondary me-2">
                  フィードバック: {{ report.feedbackCount }}
                </span>
              </div>
            </div>

            <div class="result-content">
              {{ truncateText(report.content, 200) }}
            </div>
          </div>

          <div v-if="searchResults.length === 0" class="text-center py-5 text-muted">
            検索条件に一致する日報が見つかりませんでした
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="検索中..." />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dailyReportService from '@/services/dailyReportService';
import employeeService from '@/services/employeeService';
import { useNotificationStore } from '@/stores/notification';
import { formatDate, truncateText } from '@/utils/formatters';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const router = useRouter();
const notificationStore = useNotificationStore();

const isLoading = ref(false);
const isDownloading = ref(false);
const hasSearched = ref(false);
const employees = ref([]);
const searchResults = ref([]);

const searchForm = reactive({
  employeeId: '',
  year: '',
  startDate: '',
  endDate: '',
  keyword: ''
});

const yearOptions = (() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
})();

const loadEmployees = async () => {
  try {
    const response = await employeeService.getAll();
    employees.value = response.data.filter(emp => emp.roleId !== 'RL0000001');
  } catch (error) {
    notificationStore.error('従業員一覧の取得に失敗しました');
  }
};

const resetSearch = () => {
  searchForm.employeeId = '';
  searchForm.year = '';
  searchForm.startDate = '';
  searchForm.endDate = '';
  searchForm.keyword = '';
  searchResults.value = [];
  hasSearched.value = false;
};

const executeSearch = async () => {
  isLoading.value = true;
  hasSearched.value = true;

  try {
    const params = {};

    if (searchForm.employeeId) {
      params.employeeId = searchForm.employeeId;
    }

    if (searchForm.year) {
      params.year = parseInt(searchForm.year);
    }

    if (searchForm.startDate) {
      params.startDate = searchForm.startDate;
    }

    if (searchForm.endDate) {
      params.endDate = searchForm.endDate;
    }

    if (searchForm.keyword) {
      params.keyword = searchForm.keyword;
    }

    const response = await dailyReportService.search(params);
    searchResults.value = response.data;
  } catch (error) {
    notificationStore.error('検索に失敗しました');
  } finally {
    isLoading.value = false;
  }
};

const viewReport = (reportId) => {
  router.push(`/daily-reports/${reportId}`);
};

const downloadCSV = async () => {
  if (!searchForm.year) {
    notificationStore.error('年度を選択してください');
    return;
  }

  isDownloading.value = true;

  try {
    const response = await dailyReportService.exportCSV(searchForm.year);

    // Blobからダウンロードリンクを作成
    const blob = new Blob([response.data], { type: 'text/csv;charset=shift-jis' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${searchForm.year}年度_日報.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    notificationStore.success('CSVファイルをダウンロードしました');
  } catch (error) {
    notificationStore.error('CSVのダウンロードに失敗しました');
  } finally {
    isDownloading.value = false;
  }
};

onMounted(() => {
  loadEmployees();
});
</script>

<style scoped lang="scss">
.daily-report-search {
  min-height: calc(100vh - 120px);
}

.search-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

.results-section {
  h5 {
    margin-bottom: 15px;
  }
}

.results-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.result-item {
  padding: 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.result-header {
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

.result-meta {
  display: flex;
  align-items: center;
}

.result-content {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
