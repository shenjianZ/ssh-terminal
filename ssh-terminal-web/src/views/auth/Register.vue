<template>
  <n-layout class="auth-layout">
    <n-layout-content class="auth-content">
      <n-card class="auth-card" title="注册新账号">
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
            />
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码（至少 8 位）"
              size="large"
            />
          </n-form-item>
          <n-form-item label="确认密码" path="confirmPassword">
            <n-input
              v-model:value="formData.confirmPassword"
              type="password"
              show-password-on="click"
              placeholder="请再次输入密码"
              size="large"
              @keyup.enter="handleRegister"
            />
          </n-form-item>
          <n-form-item>
            <n-button
              type="primary"
              block
              size="large"
              :loading="authStore.loading"
              @click="handleRegister"
            >
              注册
            </n-button>
          </n-form-item>
        </n-form>
        <div class="auth-footer">
          <n-text>已有账号？</n-text>
          <router-link to="/login">
            <n-button text type="primary">立即登录</n-button>
          </router-link>
        </div>
      </n-card>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: ''
})

const validatePasswordSame = (rule: any, value: string) => {
  return value === formData.password
}

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少 8 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validatePasswordSame, message: '两次输入的密码不一致', trigger: 'blur' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
    await authStore.register(formData.email, formData.password)
    message.success('注册成功')
    router.push('/')
  } catch (error: any) {
    console.error('Register error:', error)
    const errorMsg = error.response?.data?.message || error.message || '注册失败'
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