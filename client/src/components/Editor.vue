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
let observer = null

// 转换相对路径图片为 API 路径
const convertImageSrc = (src) => {
  // 如果已经是完整的 URL 或 API 路径，直接返回
  if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/api/')) {
    return src
  }
  // 对于相对路径，通过 API 访问
  const filePath = props.filePath || ''
  const fileDir = filePath.substring(0, filePath.lastIndexOf('/')) || ''
  let fullPath
  if (fileDir) {
    fullPath = `${fileDir}/${src}`
  } else {
    fullPath = src
  }
  // 清理路径（处理 ../ 等）
  const parts = fullPath.split('/')
  const stack = []
  for (const part of parts) {
    if (part === '..') {
      stack.pop()
    } else if (part !== '.' && part !== '') {
      stack.push(part)
    }
  }
  const cleanedPath = stack.join('/')
  return `/api/files/raw?path=${encodeURIComponent(cleanedPath)}`
}

// 处理单个图片元素
const processImageElement = (img) => {
  const src = img.getAttribute('src')
  if (!src) return
  
  const newSrc = convertImageSrc(src)
  if (newSrc !== src) {
    // 保存原始路径到 data 属性
    img.setAttribute('data-original-src', src)
    img.setAttribute('src', newSrc)
  }
}

// 处理编辑器内所有图片
const processAllImages = () => {
  if (!editorRef.value) return
  
  const images = editorRef.value.querySelectorAll('img')
  images.forEach(processImageElement)
}

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
    mode: 'ir', // 所见即所得模式
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
      'code',
      'fullscreen',
      'preview'
    ],
    cache: {
      enable: false // 禁用本地缓存
    },
    upload: {
      max: 10 * 1024 * 1024,
      linkToImgUrl: false,
      handler: async (files) => {
        console.log('[Vditor upload] handler 被触发，接收到的文件:', files)
        try {
          // 逐个上传文件
          for (const file of files) {
            console.log('[Vditor upload] 正在上传文件:', file.name, file.type, file.size)
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
            console.log('[Vditor upload] 上传响应:', result)

            if (result.success && result.data && result.data.succMap) {
              // 手动插入图片到编辑器 - 使用纯相对路径
              for (const [filename, url] of Object.entries(result.data.succMap)) {
                console.log('[Vditor upload] 手动插入图片:', filename, url)
                if (vditor) {
                  const mdImage = `![${filename}](${url})\n`
                  vditor.insertValue(mdImage)
                }
              }
            }
          }
          
          // 返回空的 succMap 以满足 Vditor 协议，但不依赖其自动插入
          console.log('[Vditor upload] 返回空结果给 Vditor')
          return { errFiles: [], succMap: {} }
        } catch (error) {
          console.error('[Vditor upload] 上传失败:', error)
          return { errFiles: files.map(f => f.name), succMap: {} }
        }
      }
    },
    input: (value) => {
      emit('update:modelValue', value)
      emit('change', value)
      debouncedSave(value)
    },
    after: () => {
      console.log('[Vditor] 编辑器初始化完成')
      // 初始化完成后设置初始值
      if (vditor && props.modelValue) {
        vditor.setValue(props.modelValue)
      }
      // 初始处理图片路径
      setTimeout(processAllImages, 100)
      
      // 监听 DOM 变化，处理新插入的图片
      if (editorRef.value) {
        observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            // 处理新添加的节点
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // 元素节点
                if (node.tagName === 'IMG') {
                  processImageElement(node)
                } else {
                  const images = node.querySelectorAll('img')
                  images.forEach(processImageElement)
                }
              }
            })
            // 处理属性变化
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
              const target = mutation.target
              if (target.tagName === 'IMG') {
                // 检查是否已经处理过这个 src
                const originalSrc = target.getAttribute('data-original-src')
                const currentSrc = target.getAttribute('src')
                if (originalSrc && currentSrc === originalSrc) {
                  // src 被重置为原始值，需要重新处理
                  processImageElement(target)
                } else if (!originalSrc) {
                  // 没有原始 src，说明是新图片
                  processImageElement(target)
                }
              }
            }
          })
        })
        
        observer.observe(editorRef.value, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src']
        })
      }
    },
    theme: props.theme === 'dark' ? 'dark' : 'classic',
    placeholder: '开始写作...'
  }

  vditor = new Vditor(editorRef.value, options)
})

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (vditor) {
    vditor.destroy()
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
})

// 监听内容变化（外部更新）
watch(() => props.modelValue, (newVal) => {
  if (vditor && newVal !== undefined) {
    try {
      if (newVal !== vditor.getValue()) {
        vditor.setValue(newVal)
      }
    } catch (e) {
      console.error('[Vditor] 监听内容变化更新失败:', e)
    }
  }
})

// 监听主题变化
watch(() => props.theme, (newTheme) => {
  if (vditor) {
    try {
      vditor.setTheme(newTheme === 'dark' ? 'dark' : 'classic')
    } catch (e) {
      console.error('[Vditor] 设置主题失败:', e)
    }
  }
})

// 转义正则表达式特殊字符
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// 导出方法供外部调用
defineExpose({
  getValue: () => {
    if (!vditor) {
      console.warn('[Vditor] getValue 调用时实例尚未就绪')
      return ''
    }
    try {
      let content = vditor.getValue()
      
      // 从 DOM 中收集所有原始图片路径，并在 Markdown 内容中恢复
      if (editorRef.value) {
        const images = editorRef.value.querySelectorAll('img[data-original-src]')
        images.forEach(img => {
          const originalSrc = img.getAttribute('data-original-src')
          const currentSrc = img.getAttribute('src')
          if (originalSrc && currentSrc && originalSrc !== currentSrc) {
            // 在 Markdown 内容中替换回原始路径
            content = content.replace(new RegExp(escapeRegExp(currentSrc), 'g'), originalSrc)
          }
        })
      }
      
      return content
    } catch (e) {
      console.error('[Vditor] getValue 失败:', e)
      return ''
    }
  },
  setValue: (value) => {
    if (!vditor) {
      console.warn('[Vditor] setValue 调用时实例尚未就绪')
      return
    }
    try {
      vditor.setValue(value)
    } catch (e) {
      console.error('[Vditor] setValue 失败:', e)
    }
  },
  getHTML: () => {
    if (!vditor) {
      console.warn('[Vditor] getHTML 调用时实例尚未就绪')
      return ''
    }
    try {
      return vditor.getHTML()
    } catch (e) {
      console.error('[Vditor] getHTML 失败:', e)
      return ''
    }
  }
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
