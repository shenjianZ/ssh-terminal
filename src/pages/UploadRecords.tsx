/**
 * 上传记录页面
 *
 * 显示所有上传记录，支持分页、删除、清空
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RefreshCw, Folder, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { playSound, SoundEffect } from '@/lib/sounds';

interface UploadRecord {
  id: number;
  task_id: string;
  connection_id: string;
  local_path: string;
  remote_path: string;
  total_files: number;
  total_dirs: number;
  total_size: number;
  status: string;
  bytes_transferred: number;
  files_completed: number;
  started_at: number;
  completed_at: number | null;
  elapsed_ms: number | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

interface PaginatedUploadRecords {
  records: UploadRecord[];
  total: number;
  page: number;
  page_size: number;
}

export function UploadRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const totalPages = Math.ceil(total / pageSize);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const result = await invoke<PaginatedUploadRecords>('list_upload_records', {
        page,
        pageSize,
      });
      setRecords(result.records);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load upload records:', error);
      toast.error('加载上传记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [page]);

  const handleDelete = async (id: number) => {
    playSound(SoundEffect.BUTTON_CLICK);
    try {
      await invoke('delete_upload_record', { id });
      toast.success('删除成功');
      playSound(SoundEffect.SUCCESS);
      loadRecords();
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast.error('删除失败');
    }
  };

  const handleClearAll = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (!confirm('确定要清空所有上传记录吗？此操作不可恢复。')) {
      return;
    }

    try {
      await invoke('clear_upload_records');
      toast.success('清空成功');
      playSound(SoundEffect.SUCCESS);
      loadRecords();
    } catch (error) {
      console.error('Failed to clear records:', error);
      toast.error('清空失败');
    }
  };

  const handleDeleteSelected = async () => {
    playSound(SoundEffect.BUTTON_CLICK);
    if (selectedIds.length === 0) {
      toast.warning('请先选择要删除的记录');
      return;
    }

    if (!confirm(`确定要删除选中的 ${selectedIds.length} 条记录吗？`)) {
      return;
    }

    try {
      for (const id of selectedIds) {
        await invoke('delete_upload_record', { id });
      }
      toast.success(`删除成功 ${selectedIds.length} 条记录`);
      playSound(SoundEffect.SUCCESS);
      setSelectedIds([]);
      loadRecords();
    } catch (error) {
      console.error('Failed to delete records:', error);
      toast.error('删除失败');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString('zh-CN');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: '等待中', className: 'bg-yellow-100 text-yellow-800' },
      uploading: { text: '上传中', className: 'bg-blue-100 text-blue-800' },
      completed: { text: '已完成', className: 'bg-green-100 text-green-800' },
      failed: { text: '失败', className: 'bg-red-100 text-red-800' },
      cancelled: { text: '已取消', className: 'bg-gray-100 text-gray-800' },
    };
    const s = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs ${s.className}`}>{s.text}</span>;
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === records.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => r.id));
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 顶部工具栏 */}
      <div className="border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                playSound(SoundEffect.BUTTON_CLICK);
                navigate('/sftp');
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div>
              <h1 className="text-lg font-semibold">上传记录</h1>
              <p className="text-xs text-muted-foreground">
                共 {total} 条记录
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedIds.length})
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAll}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                playSound(SoundEffect.BUTTON_CLICK);
                loadRecords();
              }}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* 记录列表 */}
      <div className="flex-1 overflow-auto p-4">
        <Card>
          {loading && records.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Folder className="h-16 w-16 mb-4 opacity-50" />
              <p>暂无上传记录</p>
            </div>
          ) : (
            <div className="divide-y">
              {/* 表头 */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 font-medium text-sm">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === records.length && records.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </div>
                <div className="col-span-2">任务 ID</div>
                <div className="col-span-2">本地路径</div>
                <div className="col-span-2">远程路径</div>
                <div className="col-span-1">状态</div>
                <div className="col-span-1 text-right">文件数</div>
                <div className="col-span-1 text-right">大小</div>
                <div className="col-span-1 text-right">时间</div>
                <div className="col-span-1"></div>
              </div>

              {/* 记录列表 */}
              {records.map((record) => (
                <div
                  key={record.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-muted/50 items-center text-sm"
                >
                  <div className="col-span-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelect(record.id)}
                      className="rounded"
                    />
                  </div>
                  <div className="col-span-2 truncate" title={record.task_id}>
                    {record.task_id}
                  </div>
                  <div className="col-span-2 truncate" title={record.local_path}>
                    {record.local_path}
                  </div>
                  <div className="col-span-2 truncate" title={record.remote_path}>
                    {record.remote_path}
                  </div>
                  <div className="col-span-1">
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="col-span-1 text-right">
                    {record.files_completed}/{record.total_files}
                  </div>
                  <div className="col-span-1 text-right">
                    {formatFileSize(record.total_size)}
                  </div>
                  <div className="col-span-1 text-right text-muted-foreground">
                    {formatDate(record.started_at)}
                  </div>
                  <div className="col-span-1 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              第 {page} 页，共 {totalPages} 页
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}