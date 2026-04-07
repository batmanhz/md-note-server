<template>
  <div class="home-container">
    <div class="sidebar">
      <div class="sidebar-header">
        <div class="app-logo">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <span>MD Notes</span>
        </div>
        <div class="sidebar-actions">
          <button class="btn-icon" @click="handleCreateFile('')" title="新建文件">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button class="btn-icon" @click="handleCreateFolder('')" title="新建文件夹">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line></svg>
          </button>
        </div>
      </div>

      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="搜索文件名..." class="input input-sm">
      </div>

      <div class="file-list-container">
        <FileTree 
          :items="filteredFiles" 
          :active-path="filesStore.currentFile?.path"
          @select="handleSelectFile"
          @create="handleCreateFile"
        />
      </div>

      <div class="sidebar-footer">
        <div class="user-info">
          <span class="username">{{ authStore.user?.username }}</span>
        </div>
        <button class="btn-ghost btn-sm" @click="handleLogout">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </div>

    <div class="main-content">
      <div v-if="filesStore.currentFile" class="editor-workspace">
        <div class="editor-header">
          <div class="file-path">{{ filesStore.currentFile.path }}</div>
          <div class="header-actions">
            <button class="btn btn-ghost btn-sm" @click="isSplitView = !isSplitView">
              {{ isSplitView ? '代码模式' : '分屏模式' }}
            </button>
            <button class="btn btn-primary btn-sm" :disabled="!isModified" @click="handleSave">
              保存
            </button>
            <button class="btn btn-danger btn-sm" @click="handleDelete">
              删除
            </button>
          </div>
        </div>

        <div class="workspace-body" :class="{ 'split-view': isSplitView }">
          <div class="editor-pane" :style="isSplitView ? { flex: '0 0 ' + splitPosition + '%', width: splitPosition + '%' } : {}">
            <Editor 
              v-model="editorContent" 
              @change="handleContentChange"
            />
          </div>
          <div 
            v-if="isSplitView" 
            class="split-divider"
            :class="{ dragging: isResizing }"
            @mousedown="startResize"
          >
            <div class="split-divider-handle"></div>
          </div>
          <div 
            v-if="isSplitView" 
            class="preview-pane markdown-body" 
            :style="{ flex: '0 0 ' + (100 - splitPosition) + '%', width: (100 - splitPosition) + '%' }"
            v-html="previewHtml"
          ></div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="empty-icon">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <line x1="10" y1="9" x2="8" y2="9"></line>
        </svg>
        <h3>选择一个文件开始编辑</h3>
        <p>或在左侧新建文件</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import { marked } from 'marked'
import FileTree from '../components/FileTree.vue'
import Editor from '../components/Editor.vue'

const router = useRouter()
const authStore = useAuthStore()
const filesStore = useFilesStore()

const searchQuery = ref('')
const editorContent = ref('')
const originalContent = ref('')  // 原始内容，用于 Dirty Check
const isModified = ref(false)
const isSplitView = ref(true)

// 分屏比例相关
const SPLIT_STORAGE_KEY = 'md-notes-split-position'
const MIN_PANE_WIDTH = 20  // 最小 20%
const MAX_PANE_WIDTH = 80  // 最大 80%
const DEFAULT_SPLIT = 50   // 默认 50:50
const splitPosition = ref(DEFAULT_SPLIT)
const isResizing = ref(false)

const filteredFiles = computed(() => {
  if (!searchQuery.value) return filesStore.files
  
  const query = searchQuery.value.toLowerCase()
  const filterList = (items) => {
    return items.reduce((acc, item) => {
      if (item.name.toLowerCase().includes(query)) {
        acc.push(item)
      } else if (item.children) {
        const filteredChildren = filterList(item.children)
        if (filteredChildren.length > 0) {
          acc.push({ ...item, children: filteredChildren })
        }
      }
      return acc
    }, [])
  }
  return filterList(filesStore.files)
})

const previewHtml = computed(() => {
  return marked.parse(editorContent.value || '')
})

// 处理浏览器关闭/刷新时的离开提示
const handleBeforeUnload = (e) => {
  if (isModified.value) {
    e.preventDefault()
    e.returnValue = '当前文件有未保存的修改，确定离开吗？'
    return '当前文件有未保存的修改，确定离开吗？'
  }
}

onMounted(() => {
  filesStore.fetchFiles()
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // 加载保存的分屏位置
  const savedPosition = localStorage.getItem(SPLIT_STORAGE_KEY)
  if (savedPosition) {
    const pos = parseInt(savedPosition, 10)
    if (!isNaN(pos) && pos >= MIN_PANE_WIDTH && pos <= MAX_PANE_WIDTH) {
      splitPosition.value = pos
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

async function handleSelectFile(item) {
  // Dirty Check: 只有真正有修改才提示
  if (isModified.value && !confirm('当前文件有未保存的修改，确定离开吗？')) {
    return
  }
  
  const file = await filesStore.readFile(item.path)
  if (file) {
    editorContent.value = file.content
    originalContent.value = file.content  // 保存原始内容
    isModified.value = false
  }
}

function handleContentChange() {
  // Dirty Check: 对比当前内容与原始内容
  isModified.value = editorContent.value !== originalContent.value
}

async function handleSave() {
  if (!filesStore.currentFile) return
  
  const res = await filesStore.saveFile(filesStore.currentFile.path, editorContent.value)
  if (res.success) {
    originalContent.value = editorContent.value  // 更新原始内容
    isModified.value = false
  } else {
    alert('保存失败: ' + res.error)
  }
}

async function handleCreateFile(parentPath) {
  const name = prompt('请输入文件名（带 .md 后缀）')
  if (!name) return
  
  const path = parentPath ? `${parentPath}/${name}` : name
  const res = await filesStore.createItem(path, 'file')
  if (res.success) {
    handleSelectFile(res.data)
  } else {
    alert('创建失败: ' + res.error)
  }
}

async function handleCreateFolder(parentPath) {
  const name = prompt('请输入文件夹名')
  if (!name) return
  
  const path = parentPath ? `${parentPath}/${name}` : name
  const res = await filesStore.createItem(path, 'folder')
  if (!res.success) {
    alert('创建失败: ' + res.error)
  }
}

async function handleDelete() {
  if (!filesStore.currentFile) return
  if (!confirm('确定要删除当前文件吗？此操作不可逆。')) return
  
  const res = await filesStore.deleteItem(filesStore.currentFile.path)
  if (res.success) {
    filesStore.currentFile = null
    editorContent.value = ''
    originalContent.value = ''
    isModified.value = false
  } else {
    alert('删除失败: ' + res.error)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

// 分屏拖动相关函数
function startResize(e) {
  // 阻止默认行为和事件冒泡
  e.preventDefault()
  e.stopPropagation()
  
  isResizing.value = true
  
  // 添加全局事件监听
  document.addEventListener('mousemove', handleResize, { passive: false })
  document.addEventListener('mouseup', stopResize)
  
  // 设置拖动时的样式
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  console.log('[SplitDivider] 开始拖动，当前位置:', splitPosition.value)
}

function handleResize(e) {
  if (!isResizing.value) return
  
  e.preventDefault()
  
  const workspaceBody = document.querySelector('.workspace-body')
  if (!workspaceBody) {
    console.warn('[SplitDivider] 找不到 workspace-body 元素')
    return
  }
  
  const rect = workspaceBody.getBoundingClientRect()
  const newPosition = ((e.clientX - rect.left) / rect.width) * 100
  
  // 限制在最小和最大宽度之间
  const clampedPosition = Math.min(
    Math.max(newPosition, MIN_PANE_WIDTH),
    MAX_PANE_WIDTH
  )
  
  // 只有位置变化时才更新
  if (Math.abs(clampedPosition - splitPosition.value) > 0.1) {
    splitPosition.value = clampedPosition
    console.log('[SplitDivider] 拖动中，新位置:', clampedPosition.toFixed(1) + '%')
  }
}

function stopResize() {
  if (!isResizing.value) return
  
  isResizing.value = false
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // 恢复默认样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // 保存用户偏好
  localStorage.setItem(SPLIT_STORAGE_KEY, splitPosition.value.toString())
  
  console.log('[SplitDivider] 停止拖动，最终位置:', splitPosition.value)
}
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--bg-color);
}

.sidebar {
  width: var(--sidebar-width);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-actions {
  display: flex;
  gap: 4px;
}

.search-box {
  padding: 12px;
}

.file-list-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.sidebar-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  font-size: 13px;
  color: var(--text-secondary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.editor-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.editor-header {
  height: 56px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.file-path {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60%;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.workspace-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  height: 100%;
  min-width: 200px;  /* 最小宽度保护 */
  overflow: hidden;  /* 防止内容溢出影响布局 */
}

/* 分屏模式下的编辑器面板 - 覆盖 flex: 1 */
.workspace-body.split-view .editor-pane {
  flex: 0 0 auto;  /* 在分屏模式下使用固定宽度 */
}

.split-divider {
  width: 16px;  /* 增加点击区域宽度，更容易定位 */
  height: 100%;
  background-color: var(--border-color);
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 10;  /* 确保在最上层 */
  /* 添加边框增强可见性 */
  border-left: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
}

.split-divider:hover {
  background-color: color-mix(in srgb, var(--primary-color, #4a90d9) 40%, transparent);
  border-color: color-mix(in srgb, var(--primary-color, #4a90d9) 50%, transparent);
}

.split-divider.dragging {
  background-color: var(--primary-color, #4a90d9) !important;
  border-color: var(--primary-color, #4a90d9) !important;
}

.split-divider-handle {
  width: 6px;
  height: 60px;  /* 增加手柄高度，更容易看到 */
  background-color: var(--text-muted, #999);
  border-radius: 3px;
  opacity: 0.7;  /* 提高默认可见性 */
  pointer-events: none;  /* 关键：让点击事件穿透到父元素 */
  transition: opacity 0.2s ease, height 0.2s ease;
}

.split-divider:hover .split-divider-handle,
.split-divider.dragging .split-divider-handle {
  opacity: 1;
  height: 80px;  /* 悬停时手柄变长 */
  background-color: var(--primary-color, #4a90d9);
}

.preview-pane {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
  background: var(--bg-color);
  border-left: 1px solid var(--border-color);
  min-width: 200px;  /* 最小宽度保护 */
}

/* 分屏模式下的预览面板 - 覆盖 flex: 1 */
.workspace-body.split-view .preview-pane {
  flex: 0 0 auto;  /* 在分屏模式下使用固定宽度 */
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.empty-icon {
  margin-bottom: 16px;
  opacity: 0.3;
}

.btn-icon {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
  border-radius: 4px;
}

.btn-icon:hover {
  background-color: var(--border-color);
  color: var(--text-primary);
}

/* Markdown Styles for Preview */
.markdown-body {
  line-height: 1.6;
  font-size: 15px;
  color: var(--text-primary);
}

:deep(.markdown-body h1), :deep(.markdown-body h2) {
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
  margin-top: 24px;
  margin-bottom: 16px;
}

:deep(.markdown-body pre) {
  background-color: var(--bg-secondary);
  padding: 16px;
  border-radius: 6px;
  overflow: auto;
}

:deep(.markdown-body blockquote) {
  border-left: 4px solid var(--border-color);
  padding-left: 16px;
  color: var(--text-secondary);
}
</style>