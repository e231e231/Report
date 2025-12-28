<template>
  <div class="reaction-buttons">
    <button
      v-for="emoji in emojis"
      :key="emoji.id"
      :class="['btn', 'btn-sm', 'reaction-btn', { active: isActive(emoji.id), 'has-reactions': getCount(emoji.id) > 0 }]"
      :title="getTooltip(emoji.id)"
      @click="handleClick(emoji.id)"
    >
      <span class="emoji-icon">{{ emoji.content }}</span>
      <span class="count">{{ getCount(emoji.id) }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import reactionService from '@/services/reactionService';
import emojiService from '@/services/emojiService';
import { useNotificationStore } from '@/stores/notification';

const props = defineProps({
  targetId: {
    type: String,
    required: true
  },
  reactions: {
    type: Object,
    default: () => ({})
  },
  isFeedback: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['reaction-toggled']);

const notificationStore = useNotificationStore();

const emojis = ref([]);

const getCount = (emojiId) => {
  const index = emojis.value.findIndex(e => e.id === emojiId) + 1;
  return props.reactions[`emj${index}`] || 0;
};

const isActive = (emojiId) => {
  const index = emojis.value.findIndex(e => e.id === emojiId) + 1;
  return props.reactions[`emj${index}Check`] || false;
};

const getTooltip = (emojiId) => {
  const index = emojis.value.findIndex(e => e.id === emojiId) + 1;
  const users = props.reactions[`emj${index}Users`] || [];
  if (users.length === 0) return 'リアクション';
  return users.map(u => u.employeeName).join(', ');
};

const loadEmojis = async () => {
  try {
    const response = await emojiService.getAll();
    emojis.value = response.data.map(emoji => ({
      id: emoji.id,
      content: emoji.emojiContent
    }));
  } catch (error) {
    console.error('Failed to load emojis:', error);
    // エラー時はデフォルトの絵文字を使用
    emojis.value = [
      { id: 'EMJ00001', content: '👍' },
      { id: 'EMJ00002', content: '❤️' },
      { id: 'EMJ00003', content: '😊' },
      { id: 'EMJ00004', content: '🎉' },
      { id: 'EMJ00005', content: '💡' },
      { id: 'EMJ00006', content: '👀' }
    ];
  }
};

const handleClick = async (emojiId) => {
  try {
    await reactionService.toggle({
      targetId: props.targetId,
      emojiId,
      isFeedback: props.isFeedback
    });
    emit('reaction-toggled');
  } catch (error) {
    notificationStore.error('リアクションの更新に失敗しました');
  }
};

onMounted(() => {
  loadEmojis();
});
</script>

<style scoped lang="scss">
.reaction-buttons {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.reaction-btn {
  padding: 4px 10px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background-color: #e9ecef;
    transform: scale(1.05);
  }

  &.active {
    background-color: #007bff;
    color: white;
    border-color: #007bff;

    .count {
      color: white;
      font-weight: 600;
    }
  }

  &.has-reactions {
    border-color: #007bff;
    border-width: 2px;
  }

  .emoji-icon {
    font-size: 16px;
    line-height: 1;
  }

  .count {
    font-size: 13px;
    font-weight: 500;
    color: #6c757d;
    min-width: 16px;
    text-align: center;
  }
}
</style>
