<template>
  <div class="daily-report-list">
    <div class="container-fluid mt-4">
      <!-- 日付選択とフィルター -->
      <div class="row mb-3">
        <div class="col-md-3">
          <label class="form-label">日付</label>
          <div class="input-group">
            <button
              class="btn btn-outline-secondary"
              @click="previousDay"
              title="前日"
            >
              &lt;&lt; 前の日へ
            </button>
            <input
              type="date"
              v-model="selectedDate"
              class="form-control"
              @change="loadDailyReports"
            />
            <button
              class="btn btn-outline-secondary"
              @click="nextDay"
              title="次日"
            >
              次の日へ &gt;&gt;
            </button>
          </div>
        </div>

        <div class="col-md-12 mt-3">
          <label class="form-label">ロール別フィルタ</label>
          <div class="role-filter">
            <label class="role-option">
              <input
                type="radio"
                value="all"
                v-model="selectedRoleFilter"
                @change="loadDailyReports"
              />
              ALL
            </label>
            <label class="role-option">
              <input
                type="radio"
                value="junior"
                v-model="selectedRoleFilter"
                @change="loadDailyReports"
              />
              新入社員
            </label>
            <label class="role-option">
              <input
                type="radio"
                value="senior"
                v-model="selectedRoleFilter"
                @change="loadDailyReports"
              />
              先輩社員
            </label>
          </div>
        </div>
      </div>

      <div class="row">
        <!-- 左側：小さなカレンダー -->
        <div class="col-md-3">
          <div class="mini-calendar-container">
            <div class="calendar-header">
              <button class="btn btn-sm" @click="previousMonth">
                &lt;
              </button>
              <span class="calendar-title">{{ calendarTitle }}</span>
              <button class="btn btn-sm" @click="nextMonth">
                &gt;
              </button>
            </div>

            <table class="mini-calendar">
              <thead>
                <tr>
                  <th class="sun">日</th>
                  <th>月</th>
                  <th>火</th>
                  <th>水</th>
                  <th>木</th>
                  <th>金</th>
                  <th class="sat">土</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(week, weekIndex) in calendarWeeks" :key="weekIndex">
                  <td
                    v-for="(day, dayIndex) in week"
                    :key="dayIndex"
                    :class="getMiniCalendarDayClass(day)"
                    @click="selectDate(day)"
                  >
                    <span v-if="day.date">{{ day.date.getDate() }}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="calendar-help mt-2">
              <div><i class="bi bi-question-circle-fill"></i></div>
            </div>
          </div>
        </div>

        <!-- 右側：タイムライン -->
        <div class="col-md-9">
          <div class="timeline-container">
            <div v-if="dailyReports.length === 0" class="text-center text-muted py-5">
              選択された日付に日報はありません
            </div>

            <div v-else>
              <div
                v-for="report in sortedReports"
                :key="report.id"
                class="timeline-item"
              >
                <div class="timeline-header">
                  <span class="timeline-datetime">
                    {{ formatReportDateTime(report) }}
                  </span>
                  <span class="timeline-author">{{ report.employeeName }}</span>
                  <span class="timeline-status" v-if="report.status === '編集済'">
                    編集済
                  </span>
                </div>

                <div class="timeline-content" @click="viewReport(report.id)">
                  <h4 class="timeline-title">{{ getReportTitle(report.content) }}</h4>
                  <div class="timeline-body">
                    <MarkdownRenderer :content="report.content" />
                  </div>
                </div>

                <div class="timeline-footer">
                  <div class="reactions-container">
                    <ReactionButton
                      :target-id="report.id"
                      :reactions="report.reactions"
                      :is-feedback="false"
                      @reaction-toggled="loadDailyReports"
                    />
                  </div>
                  <div class="feedback-info">
                    <button class="feedback-button" @click="viewReport(report.id)">
                      <span class="feedback-icon">💬</span>
                      <span class="feedback-label">返信</span>
                      <span class="feedback-count">{{ report.feedbacks?.length || 0 }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner :show="isLoading" message="読み込み中..." />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import dailyReportService from '@/services/dailyReportService';
import { useNotificationStore } from '@/stores/notification';
import { useAuthStore } from '@/stores/auth';
import { formatDate, formatDateTime } from '@/utils/formatters';
import ReactionButton from '@/components/DailyReport/ReactionButton.vue';
import MarkdownRenderer from '@/components/Common/MarkdownRenderer.vue';
import LoadingSpinner from '@/components/Common/LoadingSpinner.vue';

const router = useRouter();
const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isLoading = ref(false);
const selectedRoleFilter = ref('all');
const selectedDate = ref(getCurrentDate());
const calendarMonth = ref(getCurrentMonth());
const dailyReports = ref([]);
const monthlyReports = ref([]); // For calendar display

function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

function getCurrentMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const calendarTitle = computed(() => {
  const [year, month] = calendarMonth.value.split('-');
  return `${month}月 ${year}`;
});

const calendarWeeks = computed(() => {
  const [year, month] = calendarMonth.value.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const weeks = [];
  let currentWeek = [];

  // Fill empty days before month starts
  const startDay = firstDay.getDay();
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ date: null, hasReports: false });
  }

  // Fill days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];

    // Check if there are reports on this date (from monthlyReports)
    const hasReports = monthlyReports.value.some(report => {
      const reportDate = new Date(report.calendar);
      return reportDate.toISOString().split('T')[0] === dateStr;
    });

    currentWeek.push({ date, hasReports });

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining empty days
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push({ date: null, hasReports: false });
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
});

const sortedReports = computed(() => {
  return [...dailyReports.value].sort((a, b) => {
    return new Date(a.calendar) - new Date(b.calendar);
  });
});

const getMiniCalendarDayClass = (day) => {
  if (!day.date) return 'empty-day';

  const classes = ['calendar-day'];
  const dayOfWeek = day.date.getDay();

  if (dayOfWeek === 0) classes.push('sun');
  if (dayOfWeek === 6) classes.push('sat');

  // Check if this is the selected date
  const dateStr = day.date.toISOString().split('T')[0];
  if (dateStr === selectedDate.value) {
    classes.push('selected');
  }

  // Check if there are reports on this date
  if (day.hasReports) {
    classes.push('has-reports');
  }

  return classes.join(' ');
};

const previousMonth = async () => {
  const [year, month] = calendarMonth.value.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  calendarMonth.value = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  await loadMonthlyReports();
};

const nextMonth = async () => {
  const [year, month] = calendarMonth.value.split('-').map(Number);
  const nextDate = new Date(year, month, 1);
  calendarMonth.value = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  await loadMonthlyReports();
};

const previousDay = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() - 1);
  selectedDate.value = date.toISOString().split('T')[0];
  loadDailyReports();
};

const nextDay = () => {
  const date = new Date(selectedDate.value);
  date.setDate(date.getDate() + 1);
  selectedDate.value = date.toISOString().split('T')[0];
  loadDailyReports();
};

const selectDate = (day) => {
  if (!day.date) return;
  selectedDate.value = day.date.toISOString().split('T')[0];
  loadDailyReports();
};

const loadMonthlyReports = async () => {
  try {
    const [year, month] = calendarMonth.value.split('-').map(Number);

    const params = {
      year,
      month
    };

    const response = await dailyReportService.getByMonth(params);
    monthlyReports.value = response.data;
  } catch (error) {
    console.error('Failed to load monthly reports:', error);
  }
};

const loadDailyReports = async () => {
  isLoading.value = true;
  try {
    const [year, month] = selectedDate.value.split('-').slice(0, 2).map(Number);

    const params = {
      year,
      month
    };

    const response = await dailyReportService.getByMonth(params);

    // Update monthly reports for calendar
    monthlyReports.value = response.data;

    // Filter by selected date and role
    let filteredReports = response.data.filter(report => {
      const reportDate = new Date(report.calendar);
      return reportDate.toISOString().split('T')[0] === selectedDate.value;
    });

    // Apply role filter
    if (selectedRoleFilter.value === 'junior') {
      filteredReports = filteredReports.filter(report => report.employeeRole === 1);
    } else if (selectedRoleFilter.value === 'senior') {
      filteredReports = filteredReports.filter(report => report.employeeRole >= 2 && report.employeeRole <= 4);
    }

    dailyReports.value = filteredReports;
  } catch (error) {
    notificationStore.error('日報の取得に失敗しました');
  } finally {
    isLoading.value = false;
  }
};

const viewReport = (reportId) => {
  router.push(`/daily-reports/${reportId}`);
};

const getReportTitle = (content) => {
  if (!content) return '無題';
  const lines = content.split('\n');
  const firstLine = lines[0].trim();

  // Remove markdown heading symbols
  const title = firstLine.replace(/^#+\s*/, '');

  return title.length > 50 ? title.substring(0, 50) + '...' : title;
};

const formatReportDateTime = (report) => {
  const date = new Date(report.calendar);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Check if report has a time component
  if (report.createdAt) {
    const time = new Date(report.createdAt);
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  }

  return `${year}/${month}/${day}`;
};

onMounted(async () => {
  await loadDailyReports();
});
</script>

<style scoped lang="scss">
.daily-report-list {
  min-height: calc(100vh - 120px);
  background-color: #f5f5f5;
}

.role-filter {
  display: flex;
  gap: 20px;

  .role-option {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 16px;
    margin: 0;

    input[type="radio"] {
      cursor: pointer;
      width: 18px;
      height: 18px;
    }
  }
}

/* Mini Calendar */
.mini-calendar-container {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  .calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    .calendar-title {
      font-weight: 600;
      font-size: 16px;
    }

    button {
      border: none;
      background: none;
      font-size: 18px;
      cursor: pointer;

      &:hover {
        color: #007bff;
      }
    }
  }
}

.mini-calendar {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: center;
    padding: 8px 4px;
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid #e0e0e0;

    &.sun {
      color: #dc3545;
    }

    &.sat {
      color: #0d6efd;
    }
  }

  td {
    text-align: center;
    padding: 8px 4px;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;

    &.empty-day {
      cursor: default;
    }

    &.calendar-day {
      &:hover {
        background-color: #f0f0f0;
      }

      &.sun {
        color: #dc3545;
      }

      &.sat {
        color: #0d6efd;
      }

      &.selected {
        background-color: #ffc107;
        font-weight: bold;
      }

      &.has-reports {
        background-color: #17a2b8;
        color: white;
        font-weight: 600;

        &:hover {
          background-color: #138496;
        }
      }

      &.has-reports.selected {
        background-color: #ff6b6b;
      }
    }
  }
}

.calendar-help {
  text-align: center;
  margin-top: 10px;
  font-size: 24px;
  color: #999;
}

/* Timeline */
.timeline-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:last-child {
    margin-bottom: 0;
  }
}

.timeline-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e0e0e0;

  .timeline-datetime {
    font-size: 14px;
    color: #666;
  }

  .timeline-author {
    font-size: 14px;
    font-weight: 600;
    color: #333;
  }

  .timeline-status {
    font-size: 12px;
    color: #666;
    margin-left: auto;
  }
}

.timeline-content {
  cursor: pointer;
  margin-bottom: 15px;

  &:hover {
    .timeline-title {
      color: #007bff;
    }
  }

  .timeline-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 10px;
    transition: color 0.2s;
  }

  .timeline-body {
    font-size: 14px;
    line-height: 1.6;
    color: #333;
  }
}

.timeline-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;

  .reactions-container {
    flex: 1;
  }

  .feedback-info {
    display: flex;
    align-items: center;
  }

  .feedback-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: #f8f9fa;
    border: 2px solid #dee2e6;
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;

    &:hover {
      background-color: #e9ecef;
      border-color: #007bff;
      transform: scale(1.05);
    }

    .feedback-icon {
      font-size: 18px;
      line-height: 1;
    }

    .feedback-label {
      font-weight: 500;
      color: #495057;
    }

    .feedback-count {
      font-size: 14px;
      font-weight: 700;
      color: #007bff;
      background-color: white;
      padding: 2px 8px;
      border-radius: 10px;
      min-width: 24px;
      text-align: center;
    }
  }
}

</style>
