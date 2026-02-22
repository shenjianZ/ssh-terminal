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
          
          <!-- 验证码输入框（默认隐藏，根据后端配置动态显示） -->
          <n-form-item v-if="showVerifyCode" label="验证码" path="verifyCode">
            <div class="verify-code-input-wrapper">
              <n-input
                v-model:value="formData.verifyCode"
                placeholder="请输入6位验证码"
                size="large"
                maxlength="6"
                @keyup.enter="handleRegister"
              />
              <n-button
                type="primary"
                size="large"
                :disabled="isCountingDown"
                :loading="sendingCode"
                @click="handleSendVerifyCode"
              >
                {{ countdownText }}
              </n-button>
            </div>
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
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { sendVerifyCode as sendVerifyCodeApi } from '@/api/auth'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const router = useRouter()
const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)

const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  verifyCode: ''
})

// 验证码相关状态
const showVerifyCode = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const countdownTimer = ref<number | null>(null)

// 倒计时文字
const countdownText = computed(() => {
  if (countdown.value > 0) {
    return `${countdown.value}秒后重试`
  }
  return '发送验证码'
})

const isCountingDown = computed(() => countdown.value > 0)

const validatePasswordSame = (rule: any, value: string) => {
  return value === formData.password
}

const validateVerifyCode = (rule: any, value: string) => {
  if (!showVerifyCode.value) return true
  if (!value) {
    return new Error('请输入验证码')
  }
  if (!/^\d{6}$/.test(value)) {
    return new Error('请输入6位数字验证码')
  }
  return true
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
  ],
  verifyCode: [
    { validator: validateVerifyCode, trigger: 'blur' }
  ]
}

// 发送验证码
async function handleSendVerifyCode() {
  // 验证邮箱
  if (!formData.email) {
    message.error('请先输入邮箱地址')
    return
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    message.error('请输入有效的邮箱地址')
    return
  }

  try {
    sendingCode.value = true
    await sendVerifyCodeApi(formData.email)
    message.success('验证码已发送，请查收邮箱')
    
    // 开始倒计时
    startCountdown()
  } catch (error: any) {
    console.error('Send verify code error:', error)
    const errorMsg = error.response?.data?.message || error.message || '发送验证码失败'
    message.error(errorMsg)
  } finally {
    sendingCode.value = false
  }
}

// 开始倒计时
function startCountdown() {
  countdown.value = 60
  countdownTimer.value = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

// 停止倒计时
function stopCountdown() {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  countdown.value = 0
}

async function handleRegister() {
  try {
    await formRef.value?.validate()
    
    // 如果显示验证码字段，则必须填写验证码
    const verifyCode = showVerifyCode.value ? formData.verifyCode : undefined
    
    await authStore.register(formData.email, formData.password, verifyCode)
    message.success('注册成功')
    
    // 清理倒计时
    stopCountdown()
    
    router.push('/')
  } catch (error: any) {
    console.error('Register error:', error)
    
    // 检查是否是验证码相关的错误
    const errorMsg = error.response?.data?.message || error.message || '注册失败'
    
    // 如果后端返回验证码必填的错误，显示验证码输入框
    if (errorMsg.includes('验证码') || errorMsg.includes('verify_code') || errorMsg.includes('verify code')) {
      showVerifyCode.value = true
      message.error('需要邮箱验证码，请先发送验证码')
      return
    }
    
    message.error(errorMsg)
  }
}

// 组件卸载时清理定时器
import { onUnmounted } from 'vue'
onUnmounted(() => {
  stopCountdown()
})
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

.verify-code-input-wrapper {
  display: flex;
  gap: 8px;
  width: 100%;
}

.verify-code-input-wrapper :deep(.n-input) {
  flex: 1;
}

.verify-code-input-wrapper :deep(.n-button) {
  white-space: nowrap;
  min-width: 120px;
}
</style>