<template>
  <n-layout class="main-layout">
    <n-layout-header bordered class="header">
      <div class="header-content">
        <div class="logo">
          <n-icon size="24" color="#18a058">
            <Icon icon="mdi:console" />
          </n-icon>
          <span class="logo-text">SSH Terminal</span>
        </div>
        <n-menu
          mode="horizontal"
          :value="activeKey"
          :options="menuOptions"
          responsive
          @update:value="handleMenuSelect"
        />
        <div class="header-actions">
          <n-dropdown :options="userMenuOptions" @select="handleUserMenuSelect">
            <n-button text>
              <template #icon>
                <n-icon><Icon icon="mdi:account" /></n-icon>
              </template>
              {{ authStore.user?.email || '用户' }}
            </n-button>
          </n-dropdown>
        </div>
      </div>
    </n-layout-header>
    <n-layout-content class="content">
      <router-view />
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useMessage } from 'naive-ui'
import { Icon } from '@iconify/vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()

const activeKey = computed(() => route.name as string)

const menuOptions = [
  {
    label: '首页',
    key: 'Dashboard',
    icon: () => h(Icon, { icon: 'mdi:home' })
  },
  {
    label: 'SSH 会话',
    key: 'Sessions',
    icon: () => h(Icon, { icon: 'mdi:server' })
  },
  {
    label: '设置',
    key: 'Settings',
    icon: () => h(Icon, { icon: 'mdi:cog' })
  }
]

const userMenuOptions = [
  {
    label: '个人设置',
    key: 'settings',
    icon: () => h(Icon, { icon: 'mdi:cog' })
  },
  {
    type: 'divider'
  },
  {
    label: '退出登录',
    key: 'logout',
    icon: () => h(Icon, { icon: 'mdi:logout' })
  }
]

function handleMenuSelect(key: string) {
  router.push({ name: key })
}

async function handleUserMenuSelect(key: string) {
  if (key === 'settings') {
    router.push({ name: 'Settings' })
  } else if (key === 'logout') {
    try {
      await authStore.logout()
      message.success('已退出登录')
      router.push({ name: 'Login' })
    } catch (error: any) {
      console.error('Logout error:', error)
      const errorMsg = error.response?.data?.message || error.message || '登出失败'
      message.error(errorMsg)
      router.push({ name: 'Login' })
    }
  }
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 18px;
  white-space: nowrap;
}

.logo-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.header-actions {
  margin-left: auto;
}
</style>