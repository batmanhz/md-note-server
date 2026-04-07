import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useFilesStore = defineStore('files', () => {
  const files = ref([])
  const currentFile = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // 获取文件列表
  async function fetchFiles() {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/files')
      
      if (response.data.success) {
        files.value = response.data.data.files
      } else {
        error.value = response.data.error
      }
    } catch (err) {
      error.value = err.response?.data?.error || '获取文件列表失败'
    } finally {
      loading.value = false
    }
  }
  
  // 读取文件内容
  async function readFile(filePath) {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get('/api/files/content', {
        params: { path: filePath }
      })
      
      if (response.data.success) {
        currentFile.value = response.data.data
        return response.data.data
      } else {
        error.value = response.data.error
        return null
      }
    } catch (err) {
      error.value = err.response?.data?.error || '读取文件失败'
      return null
    } finally {
      loading.value = false
    }
  }
  
  // 保存文件
  async function saveFile(filePath, content) {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post('/api/files/save', {
        path: filePath,
        content: content
      })
      
      if (response.data.success) {
        // 更新当前文件信息
        currentFile.value = {
          ...currentFile.value,
          content: content,
          ...response.data.data
        }
        return { success: true }
      } else {
        error.value = response.data.error
        return { success: false, error: response.data.error }
      }
    } catch (err) {
      const message = err.response?.data?.error || '保存文件失败'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }
  
  // 创建文件或文件夹
  async function createItem(path, type) {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post('/api/files/create', {
        path,
        type
      })
      
      if (response.data.success) {
        await fetchFiles() // 刷新文件列表
        return { success: true, data: response.data.data }
      } else {
        error.value = response.data.error
        return { success: false, error: response.data.error }
      }
    } catch (err) {
      const message = err.response?.data?.error || '创建失败'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }
  
  // 删除文件或文件夹
  async function deleteItem(path) {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.delete('/api/files/delete', {
        data: { path }
      })
      
      if (response.data.success) {
        await fetchFiles() // 刷新文件列表
        return { success: true }
      } else {
        error.value = response.data.error
        return { success: false, error: response.data.error }
      }
    } catch (err) {
      const message = err.response?.data?.error || '删除失败'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }
  
  // 重命名文件或文件夹
  async function renameItem(oldPath, newPath) {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.post('/api/files/rename', {
        oldPath,
        newPath
      })
      
      if (response.data.success) {
        await fetchFiles() // 刷新文件列表
        return { success: true }
      } else {
        error.value = response.data.error
        return { success: false, error: response.data.error }
      }
    } catch (err) {
      const message = err.response?.data?.error || '重命名失败'
      error.value = message
      return { success: false, error: message }
    } finally {
      loading.value = false
    }
  }
  
  return {
    files,
    currentFile,
    loading,
    error,
    fetchFiles,
    readFile,
    saveFile,
    createItem,
    deleteItem,
    renameItem
  }
})