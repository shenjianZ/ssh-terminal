import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SshSessionVO, CreateSshSessionRequest, UpdateSshSessionRequest, PaginatedSshSessions } from '@/types'
import * as sshApi from '@/api/ssh'

export const useSshStore = defineStore('ssh', () => {
  const sessions = ref<SshSessionVO[]>([])
  const currentSession = ref<SshSessionVO | null>(null)
  const loading = ref(false)
  const total = ref(0)

  // 获取所有会话
  async function fetchSessions(page = 1, pageSize = 20) {
    loading.value = true
    try {
      const response = await sshApi.listSessions(page, pageSize)
      sessions.value = response.data.data
      total.value = response.data.total
      return response
    } finally {
      loading.value = false
    }
  }

  // 获取单个会话
  async function fetchSession(id: string) {
    loading.value = true
    try {
      const response = await sshApi.getSession(id)
      currentSession.value = response.data
      return response
    } finally {
      loading.value = false
    }
  }

  // 创建会话
  async function createSession(data: CreateSshSessionRequest) {
    loading.value = true
    try {
      const response = await sshApi.createSession(data)
      sessions.value.push(response.data)
      return response
    } finally {
      loading.value = false
    }
  }

  // 更新会话
  async function updateSession(id: string, data: UpdateSshSessionRequest) {
    loading.value = true
    try {
      const response = await sshApi.updateSession(id, data)
      const index = sessions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sessions.value[index] = response.data
      }
      if (currentSession.value?.id === id) {
        currentSession.value = response.data
      }
      return response
    } finally {
      loading.value = false
    }
  }

  // 删除会话
  async function deleteSession(id: string) {
    loading.value = true
    try {
      const response = await sshApi.deleteSession(id)
      sessions.value = sessions.value.filter(s => s.id !== id)
      if (currentSession.value?.id === id) {
        currentSession.value = null
      }
      return response
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    currentSession,
    loading,
    total,
    fetchSessions,
    fetchSession,
    createSession,
    updateSession,
    deleteSession
  }
})