<template>
  <n-space vertical size="large">
    <n-card title="SSH 会话管理">
      <template #header-extra>
        <n-button type="primary" @click="handleCreate">
          <template #icon>
            <n-icon><Icon icon="mdi:plus" /></n-icon>
          </template>
          新建会话
        </n-button>
      </template>
      <n-spin :show="sshStore.loading">
        <n-data-table
          :columns="columns"
          :data="sshStore.sessions"
          :pagination="pagination"
          :bordered="false"
        />
      </n-spin>
    </n-card>

    <n-modal v-model:show="showDeleteModal" preset="dialog" title="确认删除" content="确定要删除这个 SSH 会话吗？" positive-text="删除" negative-text="取消" @positive-click="handleConfirmDelete" />
  </n-space>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSshStore } from '@/stores'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { NButton, NSpace, NTag, NIcon } from 'naive-ui'
import { Icon } from '@iconify/vue'

const router = useRouter()
const sshStore = useSshStore()
const message = useMessage()

const showDeleteModal = ref(false)
const deletingId = ref<string | null>(null)

const pagination = {
  pageSize: 10
}

const columns: DataTableColumns<any> = [
  {
    title: '名称',
    key: 'name',
    render(row) {
      return h(NSpace, { align: 'center' }, {
        default: () => [
          h(NIcon, { color: '#18a058' }, { default: () => h(Icon, { icon: 'mdi:console' }) }),
          h('span', {}, { default: () => row.name })
        ]
      })
    }
  },
  {
    title: '主机',
    key: 'host'
  },
  {
    title: '端口',
    key: 'port',
    width: 80
  },
  {
    title: '用户名',
    key: 'username'
  },
  {
    title: '分组',
    key: 'group_name',
    render(row) {
      return row.group_name
        ? h(NTag, { type: 'info' }, { default: () => row.group_name })
        : h('span', { style: { color: '#999' } }, { default: () => '未分组' })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 150,
    render(row) {
      return h(NSpace, {}, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleEdit(row.id)
            },
            {
              default: () => '编辑',
              icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:pencil' }) })
            }
          ),
          h(
            NButton,
            {
              size: 'small',
              type: 'error',
              onClick: () => handleDelete(row.id)
            },
            {
              default: () => '删除',
              icon: () => h(NIcon, null, { default: () => h(Icon, { icon: 'mdi:delete' }) })
            }
          )
        ]
      })
    }
  }
]

onMounted(() => {
  sshStore.fetchSessions().catch((error: any) => {
    console.error('Fetch sessions error:', error)
    const errorMsg = error.response?.data?.message || error.message || '获取会话列表失败'
    message.error(errorMsg)
  })
})

function handleCreate() {
  router.push({ name: 'NewSession' })
}

function handleEdit(id: string) {
  router.push({ name: 'EditSession', params: { id } })
}

function handleDelete(id: string) {
  deletingId.value = id
  showDeleteModal.value = true
}

async function handleConfirmDelete() {
  if (deletingId.value) {
    try {
      await sshStore.deleteSession(deletingId.value)
      message.success('会话已删除')
      showDeleteModal.value = false
      deletingId.value = null
    } catch (error: any) {
      console.error('Delete error:', error)
      const errorMsg = error.response?.data?.message || error.message || '删除失败'
      message.error(errorMsg)
    }
  }
}
</script>