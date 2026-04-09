<template>
  <div class="editor-container">
    <div ref="editorRef" class="vditor-editor"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  theme: {
    type: String,
    default: 'light'
  },
  filePath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change', 'save'])

const editorRef = ref(null)
let vditor = null
let saveTimeout = null

// 防抖自动保存
const debouncedSave = (content) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  saveTimeout = setTimeout(() => {
    emit('save', content)
  }, 1000)
}

onMounted(() => {
  const options = {
    height: '100%',
    mode: 'sv', // 所见即所得模式
    toolbar: [
      'headings',
      'bold',
      'italic',
      'strike',
      '|',
      'link',
      '|',
      'list',
      'ordered-list',
      'check',
      '|',
      'table',
      '|',
      'upload',
      '|',
      'outline',
      'both',
      'edit-mode',
      'code',
      'code-theme',
      'content-theme',
      'export',
      'fullscreen',
      'info',
      'preview',
      'devtools'
    ],
    cache: {
      enable: false // 禁用本地缓存
    },
    upload: {
      max: 10 * 1024 * 1024,
      handler: async (files) => {
        try {
          // 后端使用 upload.single('file')，一次只处理一个文件
          // 这里我们逐个上传文件，然后合并结果
          const results = { errFiles: [], succMap: {} }
          
          for (const file of files) {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('filePath', props.filePath)

            const token = localStorage.getItem('token')
            const response = await fetch('/api/upload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            })

            const result = await response.json()

            if (result.success && result.data) {
              // 合并成功的上传结果
              if (result.data.succMap) {
                Object.assign(results.succMap, result.data.succMap)
              }
            } else {
              results.errFiles.push(file.name)
            }
          }
          
          return results
        } catch (error) {
          console.error('上传失败:', error)
          throw error
        }
      }
    },
    input: (value) => {
      emit('update:modelValue', value)
      emit('change', value)
      debouncedSave(value)
    },
    after: () => {
      // 初始化完成后设置初始值
      if (props.modelValue) {
        vditor.setValue(props.modelValue)
      }
    },
    theme: props.theme === 'dark' ? 'dark' : 'classic',
    placeholder: '开始写作...'
  }

  vditor = new Vditor(editorRef.value, options)
})

onBeforeUnmount(() => {
  if (vditor) {
    vditor.destroy()
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})

// 监听内容变化（外部更新）
watch(() => props.modelValue, (newVal) => {
  if (vditor && newVal !== vditor.getValue()) {
    vditor.setValue(newVal)
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  if (vditor) {
    vditor.setTheme(newTheme === 'dark' ? 'dark' : 'classic')
  }
})

// 导出方法供外部调用
defineExpose({
  getValue: () => vditor ? vditor.getValue() : '',
  setValue: (value) => {
    if (vditor) {
      vditor.setValue(value)
    }
  },
  getHTML: () => vditor ? vditor.getHTML() : ''
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

.vditor-editor {
  height: 100%;
}

:deep(.vditor) {
  height: 100%;
}

:deep(.vditor-ir) {
  font-family: 'Fira Code', 'Roboto Mono', monospace;
  font-size: 14px;
}
</style>
