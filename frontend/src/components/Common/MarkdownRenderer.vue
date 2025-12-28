<template>
  <div class="markdown-preview" v-html="renderedMarkdown"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

// Markedの設定
marked.setOptions({
  breaks: true, // 改行を<br>に変換
  gfm: true, // GitHub Flavored Markdown
  headerIds: false, // ヘッダーにIDを付けない
  mangle: false // メールアドレスの難読化を無効化
});

// Markdownをレンダリング
const renderedMarkdown = computed(() => {
  if (!props.content) return '';

  try {
    // MarkdownをHTMLに変換
    const html = marked.parse(props.content);

    // XSS対策のためサニタイズ
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'span', 'div', 'code', 'pre', 'blockquote',
        'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'del',
        'iframe'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height',
        'class', 'id', 'style', 'frameborder', 'allowfullscreen'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    });

    return clean;
  } catch (error) {
    console.error('Markdown rendering error:', error);
    return props.content;
  }
});
</script>

<style scoped lang="scss">
.markdown-preview {
  white-space: pre-wrap;
  word-wrap: break-word;
  line-height: 1.6;

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin-top: 24px;
    margin-bottom: 16px;
    font-weight: 600;
    line-height: 1.25;
  }

  :deep(h1) {
    font-size: 2em;
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 0.3em;
  }

  :deep(h2) {
    font-size: 1.5em;
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 0.3em;
  }

  :deep(h3) {
    font-size: 1.25em;
  }

  :deep(p) {
    margin-bottom: 16px;
  }

  :deep(ul),
  :deep(ol) {
    margin-bottom: 16px;
    padding-left: 2em;
  }

  :deep(li) {
    margin-bottom: 4px;
  }

  :deep(blockquote) {
    padding: 0 1em;
    color: #6c757d;
    border-left: 4px solid #dee2e6;
    margin: 0 0 16px 0;
  }

  :deep(code) {
    padding: 2px 6px;
    background-color: #f6f8fa;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 85%;
  }

  :deep(pre) {
    padding: 16px;
    overflow: auto;
    background-color: #f6f8fa;
    border-radius: 6px;
    margin-bottom: 16px;

    code {
      padding: 0;
      background-color: transparent;
      font-size: 100%;
    }
  }

  :deep(a) {
    color: #0d6efd;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  :deep(img) {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 16px 0;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 16px;
  }

  :deep(th),
  :deep(td) {
    padding: 6px 13px;
    border: 1px solid #dee2e6;
  }

  :deep(th) {
    font-weight: 600;
    background-color: #f6f8fa;
  }

  :deep(hr) {
    height: 4px;
    padding: 0;
    margin: 24px 0;
    background-color: #e9ecef;
    border: 0;
  }

  :deep(del) {
    text-decoration: line-through;
  }

  :deep(iframe) {
    max-width: 100%;
    margin: 16px 0;
  }
}
</style>
