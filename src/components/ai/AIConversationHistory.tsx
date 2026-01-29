/**
 * AI 对话历史列表组件
 *
 * 提供历史会话的管理功能
 */

import { useEffect, useState } from 'react';
import { AIHistoryManager } from '@/lib/ai/historyManager';
import type { AIConversationMeta } from '@/types/ai';
import {
  MessageSquare,
  Archive,
  Trash2,
  Download,
  Edit2,
  Search,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import './AIConversationHistory.css';

interface AIConversationHistoryProps {
  onSelectConversation?: (id: string) => void;
  currentConversationId?: string;
}

export function AIConversationHistory({
  onSelectConversation,
  currentConversationId
}: AIConversationHistoryProps) {
  const [conversations, setConversations] = useState<AIConversationMeta[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<AIConversationMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 加载会话列表
  const loadConversations = async () => {
    try {
      setLoading(true);
      const list = await AIHistoryManager.listConversations();
      // 按更新时间倒序排列
      const sorted = list.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      setConversations(sorted);
      setFilteredConversations(sorted);
    } catch (error) {
      console.error('加载会话列表失败:', error);
      toast.error('加载会话列表失败', {
        description: String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  // 搜索过滤
  useEffect(() => {
    if (!searchQuery) {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter(conv =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.serverIdentity.sessionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.serverIdentity.host.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, []);

  // 删除会话
  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await AIHistoryManager.deleteConversation(deleteId);
      await loadConversations();
      toast.success('会话已删除');
    } catch (error) {
      console.error('删除会话失败:', error);
      toast.error('删除会话失败', {
        description: String(error)
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteId(null);
    }
  };

  // 归档/取消归档
  const handleToggleArchive = async (id: string) => {
    try {
      await AIHistoryManager.toggleArchive(id);
      await loadConversations();
      toast.success('归档状态已更新');
    } catch (error) {
      console.error('归档会话失败:', error);
      toast.error('归档会话失败', {
        description: String(error)
      });
    }
  };

  // 导出会话
  const handleExport = async (id: string, title: string) => {
    try {
      const content = await AIHistoryManager.exportConversation(id, 'markdown');
      const filename = `${title}_${new Date().toISOString().split('T')[0]}`;
      await AIHistoryManager.downloadExport(content, filename, 'markdown');
      toast.success('会话已导出');
    } catch (error) {
      console.error('导出会话失败:', error);
      toast.error('导出会话失败', {
        description: String(error)
      });
    }
  };

  // 编辑标题
  const handleStartEdit = (id: string, title: string) => {
    setEditingId(id);
    setEditingTitle(title);
  };

  const handleSaveTitle = async (id: string) => {
    try {
      await AIHistoryManager.updateTitle(id, editingTitle);
      setEditingId(null);
      await loadConversations();
      toast.success('标题已更新');
    } catch (error) {
      console.error('更新标题失败:', error);
      toast.error('更新标题失败', {
        description: String(error)
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="conversation-history-loading">
        <MessageSquare className="animate-spin h-6 w-6" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="conversation-history">
        {/* 搜索框 */}
        <div className="history-search">
          <Search className="search-icon" />
          <Input
            placeholder="搜索会话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {/* 会话列表 */}
        <div className="history-list">
          {filteredConversations.length === 0 ? (
            <div className="empty-state">
              <MessageSquare className="empty-icon" />
              <p>{searchQuery ? '未找到匹配的会话' : '暂无历史会话'}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                className={`history-item ${conv.id === currentConversationId ? 'active' : ''} ${conv.isArchived ? 'archived' : ''}`}
                onClick={() => !editingId && onSelectConversation?.(conv.id)}
              >
                <div className="history-item-main">
                  {editingId === conv.id ? (
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      className="title-input"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <div className="history-item-icon">
                        <MessageSquare className="icon" />
                      </div>
                      <div className="history-item-content">
                        <div className="history-item-title">
                          {conv.title}
                          {conv.isArchived && <Archive className="archive-badge" />}
                        </div>
                        <div className="history-item-meta">
                          <Clock className="meta-icon" />
                          <span>{formatDate(conv.updatedAt)}</span>
                          <span>•</span>
                          <span>{conv.messageCount} 条消息</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="history-item-actions">
                  {editingId === conv.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveTitle(conv.id);
                        }}
                      >
                        保存
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                      >
                        取消
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(conv.id, conv.title);
                        }}
                        title="编辑标题"
                      >
                        <Edit2 className="action-icon" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(conv.id, conv.title);
                        }}
                        title="导出"
                      >
                        <Download className="action-icon" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleArchive(conv.id);
                        }}
                        title={conv.isArchived ? '取消归档' : '归档'}
                      >
                        <Archive className="action-icon" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(conv.id);
                        }}
                        title="删除"
                      >
                        <Trash2 className="action-icon destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              确认删除会话
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除该会话及其所有消息，无法恢复。
              <br /><br />
              是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AIConversationHistory;
