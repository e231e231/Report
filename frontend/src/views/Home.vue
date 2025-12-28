<template>
  <div class="home">
    <div class="container mt-4">
      <h2 class="mb-4">管理者ホーム</h2>

      <div class="row">
        <!-- 従業員管理 -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/employees')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-people-fill"></i>
              </div>
              <h5 class="card-title">従業員管理</h5>
              <p class="card-text">
                従業員の登録・編集・削除、ロール変更を管理します
              </p>
            </div>
          </div>
        </div>

        <!-- 日報検索 -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/admin/search')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-search"></i>
              </div>
              <h5 class="card-title">日報検索</h5>
              <p class="card-text">
                年度別に日報を検索・削除・CSV出力します
              </p>
            </div>
          </div>
        </div>

        <!-- お知らせ登録 -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/information/new')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-megaphone-fill"></i>
              </div>
              <h5 class="card-title">お知らせ登録</h5>
              <p class="card-text">
                全従業員向けのお知らせを登録します
              </p>
            </div>
          </div>
        </div>

        <!-- お知らせ一覧 -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/information')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-list-ul"></i>
              </div>
              <h5 class="card-title">お知らせ一覧</h5>
              <p class="card-text">
                登録されているお知らせを確認します
              </p>
            </div>
          </div>
        </div>

        <!-- 日報一覧 -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/daily-reports')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-journal-text"></i>
              </div>
              <h5 class="card-title">日報一覧</h5>
              <p class="card-text">
                全従業員の日報を閲覧します
              </p>
            </div>
          </div>
        </div>

        <!-- プロフィール -->
        <div class="col-md-6 col-lg-4 mb-4">
          <div class="card feature-card" @click="navigateTo('/profile')">
            <div class="card-body">
              <div class="icon-wrapper">
                <i class="bi bi-person-circle"></i>
              </div>
              <h5 class="card-title">プロフィール</h5>
              <p class="card-text">
                パスワードやカラーの変更を行います
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- システム統計情報（オプション） -->
      <div class="row mt-4" v-if="statistics">
        <div class="col-12">
          <h4 class="mb-3">システム統計</h4>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card stat-card">
            <div class="card-body">
              <h6 class="text-muted">総従業員数</h6>
              <h3>{{ statistics.totalEmployees || 0 }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card stat-card">
            <div class="card-body">
              <h6 class="text-muted">今月の日報数</h6>
              <h3>{{ statistics.monthlyReports || 0 }}</h3>
            </div>
          </div>
        </div>
        <div class="col-md-4 mb-3">
          <div class="card stat-card">
            <div class="card-body">
              <h6 class="text-muted">未読お知らせ</h6>
              <h3>{{ statistics.unreadInformation || 0 }}</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const statistics = ref(null);

const navigateTo = (path) => {
  router.push(path);
};

// オプション: システム統計情報の取得
onMounted(async () => {
  // 必要に応じてAPIから統計情報を取得
  // 今回は統計情報を表示しないためコメントアウト
  /*
  try {
    const response = await axios.get('/api/admin/statistics');
    statistics.value = response.data;
  } catch (error) {
    console.error('Failed to load statistics:', error);
  }
  */
});
</script>

<style scoped lang="scss">
.home {
  min-height: calc(100vh - 120px);
}

h2 {
  color: #333;
  font-weight: 600;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e0e0e0;
  height: 100%;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #007bff;

    .icon-wrapper {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
  }

  .card-body {
    padding: 30px;
    text-align: center;
  }

  .icon-wrapper {
    width: 80px;
    height: 80px;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 50%;
    font-size: 36px;
    transition: all 0.3s ease;

    i {
      line-height: 1;
    }
  }

  .card-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #333;
  }

  .card-text {
    color: #666;
    font-size: 14px;
    line-height: 1.6;
  }
}

.stat-card {
  border: 1px solid #e0e0e0;
  text-align: center;

  .card-body {
    padding: 25px;
  }

  h6 {
    margin-bottom: 10px;
    font-size: 14px;
  }

  h3 {
    margin: 0;
    color: #007bff;
    font-weight: 700;
  }
}

// Bootstrap Icons are assumed to be included in the project
// If not, add: npm install bootstrap-icons
</style>
