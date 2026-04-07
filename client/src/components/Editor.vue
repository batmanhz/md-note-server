<template>
  <div class="editor-container">
    <div ref="editorRef" class="cm-editor"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'light'
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const editorRef = ref(null)
let view = null

onMounted(() => {
  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      markdown(),
      props.theme === 'dark' ? oneDark : [],
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const content = update.state.doc.toString()
          emit('update:modelValue', content)
          emit('change', content)
        }
      })
    ]
  })

  view = new EditorView({
    state: startState,
    parent: editorRef.value
  })
})

onBeforeUnmount(() => {
  if (view) {
    view.destroy()
  }
})

// 监听内容变化（外部更新）
watch(() => props.modelValue, (newVal) => {
  if (view && newVal !== view.state.doc.toString()) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: newVal }
    })
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  // 简便处理：销毁重建或使用 compartment 更新（这里选择简单的销毁重建示例）
  // 生产环境建议使用 Compartment 以动态切换主题而不丢失焦点
})
</script>

<style scoped>
.editor-container {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.cm-editor {
  height: 100%;
}

:deep(.cm-editor) {
  height: 100%;
  font-family: 'Fira Code', 'Roboto Mono', monospace;
  font-size: 14px;
}

:deep(.cm-scroller) {
  height: 100% !important;
}
</style>