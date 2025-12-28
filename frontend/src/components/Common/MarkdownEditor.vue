<template>
  <div class="markdown-editor-container">
    <textarea ref="textareaRef" :value="modelValue"></textarea>

    <!-- 画像アップロード用の非表示input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/jpg,image/png,image/gif"
      style="display: none"
      @change="handleFileSelect"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import EasyMDE from 'easymde';
import 'easymde/dist/easymde.min.css';
import uploadService from '@/services/uploadService';
import { useNotificationStore } from '@/stores/notification';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const notificationStore = useNotificationStore();

const textareaRef = ref(null);
const fileInputRef = ref(null);
const isUploading = ref(false);
let easyMDE = null;

// 画像ファイル選択ハンドラー
const handleFileSelect = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // ファイルサイズチェック（5MB）
  if (file.size > 5 * 1024 * 1024) {
    notificationStore.error('ファイルサイズは5MB以下にしてください');
    return;
  }

  // ファイル形式チェック
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    notificationStore.error('JPEG、PNG、GIF形式の画像のみアップロード可能です');
    return;
  }

  try {
    isUploading.value = true;

    // 画像アップロード
    const response = await uploadService.uploadImage(file);

    if (response.success) {
      // マークダウン記法で画像URLを挿入
      const imageUrl = `${window.location.origin}${response.data.url}`;
      const markdownImage = `![${response.data.originalName}](${imageUrl})`;

      // エディタのカーソル位置に挿入
      const cm = easyMDE.codemirror;
      const cursor = cm.getCursor();
      cm.replaceRange(markdownImage, cursor);

      notificationStore.success('画像をアップロードしました');
    }
  } catch (error) {
    console.error('Image upload error:', error);
    notificationStore.error(error.response?.data?.error || '画像のアップロードに失敗しました');
  } finally {
    isUploading.value = false;
    // input要素をリセット（同じファイルを再度選択可能にする）
    event.target.value = '';
  }
};

// カスタム画像アップロードボタンの定義
const customImageButton = {
  name: 'upload-image',
  action: () => {
    fileInputRef.value.click();
  },
  className: 'fa fa-upload',
  title: '画像をアップロード'
};

onMounted(() => {
  if (textareaRef.value) {
    easyMDE = new EasyMDE({
      element: textareaRef.value,
      placeholder: props.placeholder,
      spellChecker: false,
      autofocus: false,
      sideBySideFullscreen: false,
      hideIcons: ['fullscreen', 'side-by-side'],
      toolbar: [
        'bold',
        'italic',
        'heading',
        'strikethrough',
        '|',
        'quote',
        'unordered-list',
        'ordered-list',
        '|',
        'link',
        'image',
        customImageButton,
        '|',
        'preview',
        'side-by-side',
        'fullscreen',
        '|',
        'guide'
      ]
    });

    // エディタの変更を監視
    easyMDE.codemirror.on('change', () => {
      emit('update:modelValue', easyMDE.value());
    });

    // 初期値を設定
    if (props.modelValue) {
      easyMDE.value(props.modelValue);
    }
  }
});

// propsの値が変更された場合、エディタの内容も更新
watch(() => props.modelValue, (newValue) => {
  if (easyMDE && easyMDE.value() !== newValue) {
    easyMDE.value(newValue);
  }
});

onBeforeUnmount(() => {
  if (easyMDE) {
    easyMDE.toTextArea();
    easyMDE = null;
  }
});
</script>

<style scoped lang="scss">
.markdown-editor-container {
  position: relative;

  :deep(.EasyMDEContainer) {
    .CodeMirror {
      min-height: 300px;
      border: 1px solid #dee2e6;
      border-radius: 4px;
    }

    .editor-toolbar {
      border: 1px solid #dee2e6;
      border-bottom: none;
      border-radius: 4px 4px 0 0;
      background-color: #f8f9fa;

      // カスタムアップロードボタンのスタイル
      .fa-upload::before {
        content: '📁';
        font-family: 'Arial', sans-serif;
      }
    }

    .editor-preview, .editor-preview-side {
      background-color: #fff;
      border: 1px solid #dee2e6;
    }
  }
}
</style>
