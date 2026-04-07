import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isAuthenticated = computed(() => !!token.value)
  
  // 登录
  async function login(username, password) {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      })
      
      if (response.data.success) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        // 保存到 localStorage
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))
        
        // 设置 axios 默认 header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
        
        return { success: true }
      } else {
        return { success: false, error: response.data.error }
      }
    } catch (error) {
      const message = error.response?.data?.error || '登录失败，请稍后重试'
      return { success: false, error: message }
    }
  }
  
  // 登出
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
  }
  
  // 检查认证状态
  async function checkAuth() {
    if (!token.value) {
      return false
    }
    
    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await axios.get('/api/auth/verify')
      
      if (response.data.success) {
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      logout()
      return false
    }
  }
  
  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})