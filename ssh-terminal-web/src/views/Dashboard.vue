<template>
  <n-space vertical size="large">
    <n-card title="欢迎回来">
      <n-space vertical>
        <n-text depth="3">欢迎使用 SSH Terminal Web 版！</n-text>
        <n-text>{{ authStore.user?.email || '用户' }}</n-text>
      </n-space>
    </n-card>

    <n-grid :cols="3" :x-gap="20" :y-gap="20">
      <n-gi>
        <n-statistic label="SSH 会话数" :value="sshStore.total">
          <template #prefix>
            <n-icon color="#18a058">
              <Icon icon="mdi:console" />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="最近更新" :value="lastUpdateTime">
          <template #prefix>
            <n-icon color="#2080f0">
              <Icon icon="mdi:clock" />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="账户状态" value="正常">
          <template #prefix>
            <n-icon color="#f0a020">
              <Icon icon="mdi:account" />
            </n-icon>
          </template>
        </n-statistic>
      </n-gi>
    </n-grid>

    <n-card title="快捷操作">
      <n-space>
        <n-button type="primary" @click="router.push({ name: 'NewSession' })">
          <template #icon>
            <n-icon><Icon icon="mdi:plus" /></n-icon>
          </template>
          新建 SSH 会话
        </n-button>
        <n-button @click="router.push({ name: 'Sessions' })">
          <template #icon>
            <n-icon><Icon icon="mdi:server" /></n-icon>
          </template>
          管理会话
        </n-button>
        <n-button @click="router.push({ name: 'Settings' })">
          <template #icon>
            <n-icon><Icon icon="mdi:cog" /></n-icon>
          </template>
          个人设置
        </n-button>
      </n-space>
    </n-card>

    <n-card title="最近会话">
      <n-spin :show="sshStore.loading">
        <n-list v-if="recentSessions.length > 0" bordered>
          <n-list-item v-for="session in recentSessions" :key="session.id">
            <template #prefix>
              <n-icon color="#18a058">
                <Icon icon="mdi:console" />
              </n-icon>
            </template>
            <n-thing :title="session.name" :description="`${session.username}@${session.host}:${session.port}`" />
            <template #suffix>
              <n-button text type="primary" @click="router.push({ name: 'EditSession', params: { id: session.id } })">
                编辑
              </n-button>
            </template>
          </n-list-item>
        </n-list>
        <n-empty v-else description="暂无会话" />
      </n-spin>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useSshStore } from '@/stores'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'

const router = useRouter()
const authStore = useAuthStore()
const sshStore = useSshStore()
const message = useMessage()

const lastUpdateTime = ref(new Date().toLocaleString())

const recentSessions = computed(() => {
  return sshStore.sessions.slice(0, 5)
})

onMounted(async () => {
  try {
    await sshStore.fetchSessions()
  } catch (error: any) {
    console.error('Fetch sessions error:', error)
    const errorMsg = error.response?.data?.message || error.message || '获取会话列表失败'
    message.error(errorMsg)
  }
})
</script>