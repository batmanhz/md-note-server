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
            <div class="save-status">
              <span v-if="isSaving" class="status-saving">保存中...</span>
              <span v-else-if="autoSaved" class="status-saved">已自动保存</span>
              <span v-else-if="isModified" class="status-modified">有未保存的修改</span>
            </div>
            <button class="btn btn-primary btn-sm" :disabled="!isModified" @click="handleSave">
              手动保存
            </button>
            <button class="btn btn-danger btn-sm" @click="handleDelete">
              删除
            </button>
          </div>
        </div>

        <div class="workspace-body">
          <Editor 
            v-model="editorContent" 
            :file-path="filesStore.currentFile?.path || ''"
            :theme="theme"
            @change="handleContentChange"
            @save="handleAutoSave"
          />
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFilesStore } from '../stores/files'
import FileTree from '../components/FileTree.vue'
import Editor from '../components/Editor.vue'

const router = useRouter()
const authStore = useAuthStore()
const filesStore = useFilesStore()

const searchQuery = ref('')
const editorContent = ref('')
const originalContent = ref('')  // 原始内容，用于 Dirty Check
const isModified = ref(false)
const isSaving = ref(false)
const autoSaved = ref(false)
const autoSaveTimeout = ref(null)
const theme = ref('light')  // 可以从配置或用户设置中读取

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
  
  // 从本地存储加载主题设置
  const savedTheme = localStorage.getItem('md-notes-theme')
  if (savedTheme) {
    theme.value = savedTheme
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
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
    autoSaved.value = false
  }
}

function handleContentChange() {
  // Dirty Check: 对比当前内容与原始内容
  isModified.value = editorContent.value !== originalContent.value
  autoSaved.value = false
}

// 自动保存处理（防抖）
function handleAutoSave(content) {
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
  
  isSaving.value = true
  
  autoSaveTimeout.value = setTimeout(async () => {
    await performSave(content)
    isSaving.value = false
    autoSaved.value = true
    
    // 3秒后隐藏"已自动保存"提示
    setTimeout(() => {
      autoSaved.value = false
    }, 3000)
  }, 500)
}

// 手动保存
async function handleSave() {
  if (!filesStore.currentFile) return
  isSaving.value = true
  
  await performSave(editorContent.value)
  
  isSaving.value = false
  autoSaved.value = true
  
  setTimeout(() => {
    autoSaved.value = false
  }, 3000)
}

// 执行保存操作
async function performSave(content) {
  if (!filesStore.currentFile) return
  
  const res = await filesStore.saveFile(filesStore.currentFile.path, content)
  if (res.success) {
    originalContent.value = content  // 更新原始内容
    isModified.value = false
  } else {
    console.error('保存失败:', res.error)
    // 可以添加错误提示 UI
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
    autoSaved.value = false
  } else {
    alert('删除失败: ' + res.error)
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
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
  max-width: 40%;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.save-status {
  font-size: 12px;
  margin-right: 8px;
}

.status-saving {
  color: var(--primary-color, #4a90d9);
}

.status-saved {
  color: var(--success-color, #52c41a);
}

.status-modified {
  color: var(--warning-color, #faad14);
}

.workspace-body {
  flex: 1;
  display: flex;
  overflow: hidden;
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
</style>
