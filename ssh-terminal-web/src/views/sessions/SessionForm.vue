<template>
  <n-space vertical size="large">
    <n-card :title="isEdit ? '编辑 SSH 会话' : '新建 SSH 会话'">
      <n-spin :show="loading">
        <n-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-placement="left"
          label-width="100px"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="名称" path="name">
            <n-input v-model:value="formData.name" placeholder="请输入会话名称" />
          </n-form-item>
          <n-form-item label="主机" path="host">
            <n-input v-model:value="formData.host" placeholder="请输入主机地址" />
          </n-form-item>
          <n-form-item label="端口" path="port">
            <n-input-number v-model:value="formData.port" :min="1" :max="65535" style="width: 100%" />
          </n-form-item>
          <n-form-item label="用户名" path="username">
            <n-input v-model:value="formData.username" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="分组">
            <n-input v-model:value="formData.group_name" placeholder="请输入分组名称（可选）" />
          </n-form-item>
          <n-form-item label="终端类型">
            <n-select
              v-model:value="formData.terminal_type"
              :options="terminalTypeOptions"
              placeholder="请选择终端类型"
            />
          </n-form-item>
          <n-form-item label="列数">
            <n-input-number v-model:value="formData.columns" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="行数">
            <n-input-number v-model:value="formData.rows" :min="1" style="width: 100%" />
          </n-form-item>
          <n-form-item label="密码" path="password">
            <n-input
              v-model:value="formData.password"
              type="password"
              show-password-on="click"
              placeholder="请输入密码"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <n-button @click="router.back()">取消</n-button>
          <n-button type="primary" :loading="loading" @click="handleSubmit">保存</n-button>
        </n-space>
      </template>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useSshStore, useAuthStore } from '@/stores'
import { useMessage } from 'naive-ui'
import { cryptoUtils } from '@/utils'
import type { FormInst, FormRules } from 'naive-ui'

const router = useRouter()
const route = useRoute()
const sshStore = useSshStore()
const authStore = useAuthStore()
const message = useMessage()
const formRef = ref<FormInst | null>(null)
const loading = ref(false)

const isEdit = computed(() => !!route.params.id)

const formData = reactive({
  name: '',
  host: '',
  port: 22,
  username: '',
  group_name: '',
  terminal_type: 'xterm-256color',
  columns: 80,
  rows: 24,
  password: ''
})

const terminalTypeOptions = [
  { label: 'xterm-256color', value: 'xterm-256color' },
  { label: 'xterm-color', value: 'xterm-color' },
  { label: 'xterm', value: 'xterm' },
  { label: 'vt100', value: 'vt100' }
]

const rules: FormRules = {
  name: [
    { required: true, message: '请输入会话名称', trigger: 'blur' }
  ],
  host: [
    { required: true, message: '请输入主机地址', trigger: 'blur' }
  ],
  port: [
    {
      required: true,
      type: 'number',
      message: '请输入端口',
      trigger: ['blur', 'change'],
      validator: (rule, value) => {
        return value !== null && value !== undefined && value > 0
      }
    }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

onMounted(async () => {
  if (isEdit.value) {
    loading.value = true
    try {
      const id = route.params.id as string
      await sshStore.fetchSession(id)
      if (sshStore.currentSession) {
        const session = sshStore.currentSession
        formData.name = session.name
        formData.host = session.host
        formData.port = session.port
        formData.username = session.username
        formData.group_name = session.group_name || ''
        formData.terminal_type = session.terminal_type || 'xterm-256color'
        formData.columns = session.columns || 80
        formData.rows = session.rows || 24
      }
    } catch (error: any) {
      console.error('Fetch session error:', error)
      const errorMsg = error.response?.data?.message || error.message || '获取会话信息失败'
      message.error(errorMsg)
      router.back()
    } finally {
      loading.value = false
    }
  }
})

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    loading.value = true

    // 从 auth store 获取当前用户的 device_id
    const deviceId = authStore.deviceId
    if (!deviceId) {
      throw new Error('Device ID not found')
    }

    // 构建 Tauri 格式的 Auth Method
    const authMethod = {
      Password: {
        password: formData.password
      }
    }
    const authJson = JSON.stringify(authMethod)

    // 使用 device_id 加密 (匹配 Tauri 的 encrypt_password)
    const { encrypted: authMethodEncrypted, nonce: authNonce } =
      await cryptoUtils.encryptPassword(authJson, deviceId)

    const data = {
      name: formData.name,
      host: formData.host,
      port: formData.port,
      username: formData.username,
      group_name: formData.group_name || undefined,
      terminal_type: formData.terminal_type,
      columns: formData.columns,
      rows: formData.rows,
      auth_method_encrypted: authMethodEncrypted,
      auth_nonce: authNonce,
      auth_key_salt: ''  // device_id 方式不需要 salt
    }

    if (isEdit.value) {
      const id = route.params.id as string
      await sshStore.updateSession(id, data)
      message.success('会话更新成功')
    } else {
      await sshStore.createSession(data)
      message.success('会话创建成功')
    }

    router.push({ name: 'Sessions' })
  } catch (error: any) {
    console.error('Submit error:', error)
    const errorMsg = error.response?.data?.message || error.message || '保存失败'
    message.error(errorMsg)
  } finally {
    loading.value = false
  }
}
</script>