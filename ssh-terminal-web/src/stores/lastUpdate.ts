import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getLastUpdate } from '@/api/user'
import type { LastUpdateResponse } from '@/types/user'

export const useLastUpdateStore = defineStore('lastUpdate', () => {
  const lastUpdatedTime = ref<string>('-')
  const lastUpdatedAt = ref<number>(0)
  const hasData = ref<boolean>(false)
  const loading = ref<boolean>(false)

  /**
   * 获取并更新最近更新时间
   */
  async function fetchLastUpdate() {
    if (loading.value) return

    loading.value = true
    try {
      const response = await getLastUpdate()
      if (response.data) {
        lastUpdatedAt.value = response.data.last_updated_at
        hasData.value = response.data.has_data

        if (response.data.last_updated_at > 0) {
          // 将 Unix 秒级时间戳转换为毫秒级，然后转换为本地时间字符串
          lastUpdatedTime.value = new Date(response.data.last_updated_at * 1000).toLocaleString()
        } else {
          lastUpdatedTime.value = '-'
        }
      }
    } catch (error) {
      console.error('Failed to fetch last update time:', error)
      lastUpdatedTime.value = '-'
    } finally {
      loading.value = false
    }
  }

  /**
   * 格式化最后更新时间
   */
  function formatLastUpdate(timestamp: number): string {
    if (timestamp <= 0) return '-'
    // 将 Unix 秒级时间戳转换为毫秒级
    return new Date(timestamp * 1000).toLocaleString()
  }

  return {
    lastUpdatedTime,
    lastUpdatedAt,
    hasData,
    loading,
    fetchLastUpdate,
    formatLastUpdate,
  }
})