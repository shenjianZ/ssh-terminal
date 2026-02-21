<template>
  <n-layout class="auth-layout">
    <n-layout-content class="auth-content">
      <n-card class="auth-card" title="SSH Terminal 登录">
        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          label-width="auto"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="邮箱" path="email">
            <n-input
              v-model:value="formData.email"
              placeholder="请输入邮箱"
              size="large"
              @keyup.enter="handleLogin"
            />
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
              size="large"
              @keyup.enter="handleLogin"
            />
          </n-form-item>
          <n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="authStore.loading"
              @click="handleLogin"
            >
              登录
            </n-button>
          </n-form-item>
        </n-form>
        <div class="auth-footer">
          <n-text>还没有账号？</n-text>
          <router-link to="/register">
            <n-button text type="primary">立即注册</n-button>
          </router-link>
        </div>
      </n-card>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const formData = reactive({
  email: '',
  password: ''
})

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少 6 位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await formRef.value?.validate()
    await authStore.login(formData.email, formData.password)
    message.success('登录成功')
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch (error: any) {
    console.error('Login error:', error)
    const errorMsg = error.response?.data?.message || error.message || '登录失败'
    message.error(errorMsg)
  }
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-content {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-footer {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}
</style>