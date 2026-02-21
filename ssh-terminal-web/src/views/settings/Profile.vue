<template>
  <n-space vertical size="large">
    <n-card title="个人资料">
      <n-spin :show="userStore.loading">
        <n-form
          ref="formRef"
          :model="formData"
          label-placement="left"
          label-width="100px"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="用户名">
            <n-input v-model:value="formData.username" placeholder="请输入用户名" />
          </n-form-item>
          <n-form-item label="邮箱">
            <n-input :value="userStore.profile?.email" disabled />
          </n-form-item>
          <n-form-item label="手机">
            <n-input v-model:value="formData.phone" placeholder="请输入手机号" />
          </n-form-item>
          <n-form-item label="QQ">
            <n-input v-model:value="formData.qq" placeholder="请输入 QQ 号" />
          </n-form-item>
          <n-form-item label="微信">
            <n-input v-model:value="formData.wechat" placeholder="请输入微信号" />
          </n-form-item>
          <n-form-item label="个人简介">
            <n-input
              v-model:value="formData.bio"
              type="textarea"
              placeholder="请输入个人简介"
              :rows="4"
            />
          </n-form-item>
        </n-form>
      </n-spin>
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" :loading="userStore.loading" @click="handleSave">
            保存
          </n-button>
        </n-space>
      </template>
    </n-card>

    <n-card title="账号管理">
      <n-space vertical>
        <n-text>删除账号将永久删除您的所有数据，此操作不可恢复。</n-text>
        <n-button type="error" @click="showDeleteModal = true">
          删除账号
        </n-button>
      </n-space>
    </n-card>

    <n-modal
      v-model:show="showDeleteModal"
      preset="dialog"
      title="确认删除账号"
      type="error"
    >
      <n-space vertical>
        <n-text>删除账号将永久删除您的所有数据，此操作不可恢复。</n-text>
        <n-input
          v-model:value="deletePassword"
          type="password"
          placeholder="请输入密码确认删除"
          show-password-on="click"
        />
      </n-space>
      <template #action>
        <n-button @click="showDeleteModal = false">取消</n-button>
        <n-button type="error" :loading="deleting" @click="handleDeleteAccount">
          确认删除
        </n-button>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useAuthStore } from '@/stores'
import { useMessage } from 'naive-ui'

const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()
const message = useMessage()

const showDeleteModal = ref(false)
const deletePassword = ref('')
const deleting = ref(false)

const formData = reactive({
  username: '',
  phone: '',
  qq: '',
  wechat: '',
  bio: ''
})

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.profile) {
    formData.username = userStore.profile.username || ''
    formData.phone = userStore.profile.phone || ''
    formData.qq = userStore.profile.qq || ''
    formData.wechat = userStore.profile.wechat || ''
    formData.bio = userStore.profile.bio || ''
  }
})

async function handleSave() {
  try {
    await userStore.updateProfile(formData)
    message.success('保存成功')
  } catch (error: any) {
    console.error('Save error:', error)
    const errorMsg = error.response?.data?.message || error.message || '保存失败'
    message.error(errorMsg)
  }
}

async function handleDeleteAccount() {
  if (!deletePassword.value) {
    message.warning('请输入密码')
    return
  }

  // 如果用户信息不存在，先获取用户信息
  if (!authStore.user?.id) {
    try {
      await userStore.fetchProfile()
      // 再次检查
      if (!authStore.user?.id) {
        message.error('用户信息不存在，请重新登录')
        return
      }
    } catch (error: any) {
      console.error('Fetch profile error:', error)
      const errorMsg = error.response?.data?.message || error.message || '获取用户信息失败'
      message.error(errorMsg)
      return
    }
  }

  deleting.value = true
  try {
    await authStore.deleteAccount(authStore.user.id, deletePassword.value)
    message.success('账号已删除')
    router.push({ name: 'Login' })
  } catch (error: any) {
    console.error('Delete error:', error)
    const errorMsg = error.response?.data?.message || error.message || '删除失败，请检查密码是否正确'
    message.error(errorMsg)
  } finally {
    deleting.value = false
  }
}
</script>